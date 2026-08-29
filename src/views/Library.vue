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
      <el-button type="primary" class="btn-primary" style="width:100%" @click="quickReserve">
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
          <div v-for="floor in floors" :key="floor.name" class="floor-card">
            <div class="floor-name">{{ floor.name }}</div>
            <div class="floor-avail">{{ floor.avail }} 可用</div>
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
        <el-button type="primary" @click="confirmReserve">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'

interface LibraryBuilding {
  id: string
  name: string
  icon: string
  avail: number
}

interface Seat {
  id: string
  number: string
  available: boolean
}

const libraries: LibraryBuilding[] = [
  { id: 'lib1', name: '总馆', icon: '🏛️', avail: 120 },
  { id: 'lib2', name: '工学分馆', icon: '🔧', avail: 85 },
  { id: 'lib3', name: '理学分馆', icon: '🔬', avail: 63 },
  { id: 'lib4', name: '信息分馆', icon: '💻', avail: 42 },
  { id: 'lib5', name: '医学分馆', icon: '🏥', avail: 56 },
  { id: 'lib6', name: '文科分馆', icon: '📖', avail: 78 },
]

const floors = [
  { name: '一楼阅览室', avail: 35 },
  { name: '二楼自习室', avail: 28 },
  { name: '三楼研修室', avail: 15 },
  { name: '四楼多媒体室', avail: 8 },
]

const showDetailDialog = ref(false)
const selectedLib = ref<LibraryBuilding | null>(null)
const selectedSeat = ref<Seat | null>(null)
const selectedTimeSlot = ref('08:00-12:00')

const seats = computed<Seat[]>(() => {
  if (!selectedLib.value) return []
  return Array.from({ length: 20 }, (_, i) => ({
    id: `${selectedLib.value!.id}-${i + 1}`,
    number: `${i + 1}`,
    available: Math.random() > 0.3
  }))
})

const reservation = reactive({
  building: '',
  seat: '',
  timeSlot: '',
  date: ''
})

const hasReservation = computed(() => !!reservation.building)

function selectBuilding(lib: LibraryBuilding) {
  selectedLib.value = lib
  selectedSeat.value = null
  showDetailDialog.value = true
}

function confirmReserve() {
  if (!selectedLib.value || !selectedSeat.value) {
    return
  }
  reservation.building = selectedLib.value.name
  reservation.seat = `${selectedSeat.value.number}号座位`
  reservation.timeSlot = selectedTimeSlot.value
  reservation.date = new Date().toLocaleDateString()
  showDetailDialog.value = false
}

function quickReserve() {
  if (hasReservation.value) {
    return
  }
  reservation.building = libraries[0].name
  reservation.seat = `${Math.floor(Math.random() * 30 + 1)}号座位`
  reservation.timeSlot = '08:00-12:00'
  reservation.date = new Date().toLocaleDateString()
}

function cancelReservation() {
  reservation.building = ''
  reservation.seat = ''
  reservation.timeSlot = ''
  reservation.date = ''
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
