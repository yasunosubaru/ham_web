<template>
  <div class="library-page">
    <!-- Reservation status -->
    <div class="reservation-status" :class="hasReservation ? 'active' : 'none'">
      <div class="status-dot" />
      <div class="status-info">
        <div class="status-title">{{ hasReservation ? '✅ 已预约' : '暂无预约' }}</div>
        <div class="status-detail">
          {{ hasReservation ? `${reservation.building} · ${reservation.seat} · ${reservation.timeSlot}` : '选择图书馆进行预约' }}
        </div>
      </div>
      <el-button v-if="hasReservation" text type="danger" @click="cancelReservation">取消</el-button>
    </div>

    <!-- Quick reserve -->
    <div style="padding:0 12px;margin-bottom:12px">
      <el-button type="primary" class="btn-primary" style="width:100%" @click="quickReserve" :disabled="hasReservation || loading">
        ⚡ 快速预约首选座位
      </el-button>
    </div>

    <!-- Building list -->
    <div class="section">
      <div class="section-title">选择图书馆</div>
    </div>

    <div class="building-grid">
      <div
        v-for="lib in libraries"
        :key="lib.id"
        class="building-card"
        @click="selectBuilding(lib)"
      >
        <div class="building-icon">{{ lib.icon }}</div>
        <div class="building-name">{{ lib.name }}</div>
        <div class="building-avail">剩余 {{ lib.avail }} 座位</div>
      </div>
    </div>

    <!-- Building detail dialog -->
    <el-dialog v-model="showDetailDialog" :title="`${selectedLib?.icon} ${selectedLib?.name}`" width="90%">
      <div v-if="selectedLib">
        <div class="section-title">楼层</div>
        <div class="floor-grid">
          <div v-for="floor in selectedLib.floors" :key="floor" class="floor-card" @click="selectFloor(floor)">
            <div class="floor-name">{{ floor }}</div>
            <div class="floor-avail">{{ getFloorAvail(floor) }} 可用</div>
          </div>
        </div>

        <div class="section-title" style="margin-top:16px">选择座位</div>
        <div class="seat-grid">
          <div
            v-for="seat in seats"
            :key="seat.id"
            class="seat"
            :class="{ available: seat.available, selected: selectedSeat?.id === seat.id }"
            @click="seat.available && (selectedSeat = seat)"
          >
            {{ seat.number }}
          </div>
        </div>

        <div class="section-title" style="margin-top:16px">选择时段</div>
        <el-select v-model="selectedTimeSlot" style="width:100%">
          <el-option label="08:00 - 12:00" value="08:00-12:00" />
          <el-option label="12:00 - 17:00" value="12:00-17:00" />
          <el-option label="17:00 - 22:00" value="17:00-22:00" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReserve" :disabled="!selectedSeat || loading">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { LibraryApi, type LibraryBuilding, type LibraryReservation } from '@/api/library'

const libraries = ref<LibraryBuilding[]>([])
const loading = ref(false)

const showDetailDialog = ref(false)
const selectedLib = ref<LibraryBuilding | null>(null)
const selectedFloor = ref<string>('')
const selectedSeat = ref<{ id: string; number: string; available: boolean } | null>(null)
const selectedTimeSlot = ref('08:00-12:00')

const seats = computed(() => {
  if (!selectedLib.value || !selectedFloor.value) return []
  return Array.from({ length: 20 }, (_, i) => ({
    id: `${selectedLib.value!.id}-${selectedFloor.value}-${i + 1}`,
    number: `${i + 1}`,
    available: Math.random() > 0.3
  }))
})

const reservation = reactive<LibraryReservation>({
  building: '',
  seat: '',
  timeSlot: '',
  date: ''
})

const hasReservation = computed(() => !!reservation.building)

onMounted(async () => {
  await loadBuildings()
  await loadReservation()
})

async function loadBuildings() {
  try {
    const data = await LibraryApi.getBuildings()
    if (data.length > 0) {
      libraries.value = data
    }
  } catch (error) {
    console.error('Failed to load buildings:', error)
  }
}

async function loadReservation() {
  try {
    const data = await LibraryApi.getReservation()
    if (data) {
      reservation.building = data.building
      reservation.seat = data.seat
      reservation.timeSlot = data.timeSlot
      reservation.date = data.date
    }
  } catch (error) {
    console.error('Failed to load reservation:', error)
  }
}

function selectBuilding(lib: LibraryBuilding) {
  selectedLib.value = lib
  selectedFloor.value = lib.floors[0] || ''
  selectedSeat.value = null
  showDetailDialog.value = true
}

function selectFloor(floor: string) {
  selectedFloor.value = floor
  selectedSeat.value = null
}

function getFloorAvail(floor: string): number {
  return Math.floor(Math.random() * 30) + 10
}

async function confirmReserve() {
  if (!selectedLib.value || !selectedSeat.value) {
    ElMessage.warning('请选择座位')
    return
  }
  
  loading.value = true
  try {
    await LibraryApi.reserve({
      buildingId: selectedLib.value.id,
      buildingName: selectedLib.value.name,
      floor: selectedFloor.value,
      seatNumber: selectedSeat.value.number,
      timeSlot: selectedTimeSlot.value,
      date: new Date().toLocaleDateString()
    })
    ElMessage.success('预约成功！')
    showDetailDialog.value = false
    await loadReservation()
  } catch (error) {
    ElMessage.error('预约失败，请重试')
  } finally {
    loading.value = false
  }
}

function quickReserve() {
  if (hasReservation.value) {
    ElMessage.warning('已有预约，请先取消')
    return
  }
  if (libraries.value.length === 0) return
  
  const lib = libraries.value[0]
  const seatNum = Math.floor(Math.random() * 30 + 1)
  
  loading.value = true
  LibraryApi.reserve({
    buildingId: lib.id,
    buildingName: lib.name,
    floor: lib.floors[0],
    seatNumber: seatNum.toString(),
    timeSlot: '08:00-12:00',
    date: new Date().toLocaleDateString()
  }).then(() => {
    ElMessage.success('快速预约成功！')
    loadReservation()
  }).catch(() => {
    ElMessage.error('预约失败')
  }).finally(() => {
    loading.value = false
  })
}

async function cancelReservation() {
  try {
    await LibraryApi.cancelReservation()
    ElMessage.success('已取消预约')
    reservation.building = ''
    reservation.seat = ''
    reservation.timeSlot = ''
    reservation.date = ''
  } catch (error) {
    ElMessage.error('取消失败')
  }
}
</script>

<style lang="scss" scoped>
.library-page {
  padding-bottom: 80px;
}

.reservation-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  transition: background 0.3s;

  &.active {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  &.none {
    background: var(--bg-input);
    border: 1px solid var(--border-color);
  }
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  .active & { background: #67C23A; }
  .none & { background: #d1d5db; }
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-detail {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.building-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 12px;
}

.building-card {
  background: var(--bg-card);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.2s, background 0.3s;

  &:active { transform: scale(0.97); }
}

.building-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.building-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.building-avail {
  font-size: 11px;
  color: #67C23A;
  margin-top: 4px;
}

.floor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.floor-card {
  background: var(--bg-input);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
}

.floor-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.floor-avail {
  font-size: 11px;
  color: #67C23A;
  margin-top: 4px;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.seat {
  padding: 10px 4px;
  text-align: center;
  border-radius: 8px;
  font-size: 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  cursor: pointer;
  color: var(--text-primary);

  &.available {
    cursor: pointer;
    &:hover { background: rgba(64, 158, 255, 0.1); }
  }

  &.selected {
    background: #409EFF;
    color: white;
    border-color: #409EFF;
  }

  &:not(.available) {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>