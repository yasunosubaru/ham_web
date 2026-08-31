import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import CryptoJS from 'crypto-js'

const CAS_BASE_URL = 'https://cas.whu.edu.cn'
const EDU_BASE_URL = 'https://jwgl.whu.edu.cn'
// 改成你的 Worker 域名 + /api
const PROXY_BASE_URL = 'https://whu-ham-proxy.1845639127.workers.dev/api';

interface RequestOptions extends AxiosRequestConfig {
  useProxy?: boolean
  responseType?: 'text' | 'json' | 'blob'
}

class RequestService {
  private casClient: AxiosInstance
  private eduClient: AxiosInstance
  private proxyClient: AxiosInstance
  private casCookie: string = ''

  constructor() {
    this.casClient = axios.create({
      baseURL: CAS_BASE_URL,
      timeout: 15000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    this.eduClient = axios.create({
      baseURL: EDU_BASE_URL,
      timeout: 20000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    this.proxyClient = axios.create({
      baseURL: PROXY_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // CAS Client interceptor
    this.casClient.interceptors.request.use((config) => {
      if (this.casCookie) {
        config.headers.Cookie = this.casCookie
      }
      return config
    })

    // Education Client interceptor
    this.eduClient.interceptors.request.use((config) => {
      if (this.casCookie) {
        config.headers.Cookie = this.casCookie
      }
      config.headers.Host = 'jwgl.whu.edu.cn'
      config.headers.Referer = 'https://jwgl.whu.edu.cn/'
      return config
    })

    // Proxy Client interceptor (for backend API)
    this.proxyClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('ham_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptors
    this.eduClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 302) {
          this.clearCasCookie()
        }
        return Promise.reject(error)
      }
    )
  }

  setCasCookie(cookie: string) {
    this.casCookie = cookie
    localStorage.setItem('ham_cas_cookie', cookie)
  }

  getCasCookie(): string {
    if (!this.casCookie) {
      this.casCookie = localStorage.getItem('ham_cas_cookie') || ''
    }
    return this.casCookie
  }

  clearCasCookie() {
    this.casCookie = ''
    localStorage.removeItem('ham_cas_cookie')
  }

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { useProxy = false, responseType = 'text', ...axiosOptions } = options
    const client = useProxy ? this.proxyClient : (url.includes('cas.whu.edu.cn') ? this.casClient : this.eduClient)

    const response: AxiosResponse<T> = await client.request({
      url,
      responseType,
      ...axiosOptions,
    })

    return response.data
  }

  async get<T>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET', params })
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', data })
  }

  // CAS Authentication
  async casLogin(service: string): Promise<{ url: string; text: string; needsReAuth: boolean; reAuthUrl?: string }> {
    const loginUrl = `${CAS_BASE_URL}/authserver/login?service=${encodeURIComponent(service)}`
    
    try {
      const response = await this.casClient.get(loginUrl, { responseType: 'text' })
      
      const needsReAuth = response.request?.responseURL?.includes('ReAuth') || false
      const reAuthUrl = needsReAuth ? response.request.responseURL : undefined

      return {
        url: response.request?.responseURL || loginUrl,
        text: response.data,
        needsReAuth,
        reAuthUrl,
      }
    } catch (error: any) {
      throw new Error(`CAS登录失败: ${error.message}`)
    }
  }

  async casFastLogin(service: string): Promise<{ url: string; text: string; needsReAuth: boolean; reAuthUrl?: string }> {
    return this.casLogin(service)
  }

  // Education System APIs
  async loginEducation(): Promise<void> {
    const service = 'https://jwgl.whu.edu.cn/sso/jznewsixlogin'
    const result = await this.casFastLogin(service)

    if (result.needsReAuth) {
      throw new Error('需要重新认证，请重新登录信息门户')
    }

    if (!result.text.includes('教务管理信息服务平台')) {
      const errorMsg = this.parseJsError(result.text)
      throw new Error(`教务系统登录失败: ${errorMsg || '请检查信息门户账号密码'}`)
    }

    // After successful login, get student ID
    await this.getStudentId()
  }

  private parseJsError(html: string): string {
    const regex = /var dlktsxx="([^"]*)";/
    const match = regex.exec(html)
    return match ? match[1] : ''
  }

  async getStudentId(): Promise<string> {
    try {
      const response = await this.eduClient.get(
        '/xtgl/index_cxYhxxIndex.html',
        {
          params: { xt: 'jw', localeKey: 'zh_CN', gnmkdm: 'index' },
          responseType: 'text',
        }
      )

      // Parse student ID from HTML
      const $ = this.loadCheerio(response.data)
      const src = $('img.media-object').attr('src') || ''
      const xhId = new URL(src, 'https://dummy.base').searchParams.get('xh_id') || ''
      
      const nameText = $('h4.media-heading').text()
      const name = nameText.replace(/\s*[\u4e00-\u9fa5]+\s*/, '').replace(/\u00a0/g, ' ').trim()
      
      const pText = $('.media-body > p').first().text().trim()
      const college = pText.replace(/\s*\d{4}.*/, '').trim()

      return xhId
    } catch (error) {
      console.warn('Failed to parse student ID:', error)
      return ''
    }
  }

  async getUserInfo(): Promise<{ studentId: string; name: string; college: string }> {
    const response = await this.eduClient.get(
      '/xtgl/index_cxYhxxIndex.html',
      {
        params: { xt: 'jw', localeKey: 'zh_CN', gnmkdm: 'index' },
        responseType: 'text',
      }
    )

    const $ = this.loadCheerio(response.data)
    const src = $('img.media-object').attr('src') || ''
    const xhId = new URL(src, 'https://dummy.base').searchParams.get('xh_id') || ''
    const nameText = $('h4.media-heading').text()
    const name = nameText.replace(/\s*[\u4e00-\u9fa5]+\s*/, '').replace(/\u00a0/g, ' ').trim()
    const pText = $('.media-body > p').first().text().trim()
    const college = pText.replace(/\s*\d{4}.*/, '').trim()

    return { studentId: xhId, name, college }
  }

  async getGradeList(year?: number, semester?: number): Promise<any> {
    const validate = this.generateValidate()
    const currentYear = year || new Date().getFullYear()
    const currentSemester = semester || (new Date().getMonth() >= 8 ? 1 : 2)

    const query = new URLSearchParams({
      doType: 'query',
      gnmkdm: 'N305005',
      validate,
      xnm: currentYear.toString(),
      xqm: currentSemester.toString(),
      'queryModel.showCount': '150',
    })

    const body = new URLSearchParams({
      validate,
      xnm: currentYear.toString(),
      xqm: currentSemester.toString(),
    })

    const response = await this.eduClient.post(
      `/cjcx/cjcx_cxXsgrcj.html?${query.toString()}`,
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'text',
      }
    )

    const cleanText = response.data.replaceAll('\u0000', '')
    const json = JSON.parse(cleanText)
    return this.parseGradeResponse(json)
  }

  async getCourseList(year?: number, semester?: number): Promise<any> {
    const validate = this.generateValidate()
    const currentYear = year || new Date().getFullYear()
    const currentSemester = semester || (new Date().getMonth() >= 8 ? 1 : 2)

    const response = await this.eduClient.post(
      '/kbdy/bjkb_cxBjKbIndex.html',
      new URLSearchParams({
        xnm: currentYear.toString(),
        xqm: currentSemester.toString(),
        validate,
      }).toString(),
      {
        responseType: 'text',
      }
    )

    return response.data
  }

  async getSemesterConfig(): Promise<{ year: number; semester: number }> {
    try {
      const response = await this.eduClient.get(
        '/xtgl/index_cxYhxxIndex.html',
        {
          params: { xt: 'jw', localeKey: 'zh_CN', gnmkdm: 'index' },
          responseType: 'text',
        }
      )

      const $ = this.loadCheerio(response.data)
      const yearText = $('select[name="xnm"]').find('option:selected').text()
      const semesterText = $('select[name="xqm"]').find('option:selected').text()
      
      return {
        year: parseInt(yearText) || new Date().getFullYear(),
        semester: parseInt(semesterText) || (new Date().getMonth() >= 8 ? 1 : 2),
      }
    } catch {
      return {
        year: new Date().getFullYear(),
        semester: new Date().getMonth() >= 8 ? 1 : 2,
      }
    }
  }

  private generateValidate(): string {
    return 'sl' + Math.floor(Math.random() * 1e10).toString(36) + Date.now().toString(36)
  }

  private parseGradeResponse(json: any): any {
    if (!json.items || !Array.isArray(json.items)) {
      return { items: [], userInfo: { college: '', major: '', name: '', studentId: '' } }
    }

    const items = json.items
      .filter((item: any) => item.xh !== '')
      .map((item: any) => {
        const semesterMap: Record<number, number> = { 3: 1, 12: 2, 16: 3 }
        return {
          year: parseInt(item.xnm) || 0,
          semester: semesterMap[parseInt(item.xqm)] || 1,
          name: item.kcmc || '',
          courseId: item.kch || '',
          instructor: item.jsxm || '',
          credit: parseFloat(item.xf) || 0,
          courseType: item.kclbmc || '',
          score: parseInt(item.cj) || 0,
          courseCollege: item.kkbmmc || '',
          isEnabled: true,
          gpa: this.scoreToGPA(parseInt(item.cj) || 0),
        }
      })

    const userInfo = {
      college: json.userInfo?.jgmc || '',
      major: json.userInfo?.zymc || '',
      name: json.userInfo?.xm || '',
      studentId: json.userInfo?.xh || '',
    }

    return { items, userInfo }
  }

  private scoreToGPA(score: number): number {
    if (score >= 90) return 4.0
    if (score >= 85) return 3.7
    if (score >= 82) return 3.3
    if (score >= 78) return 3.0
    if (score >= 75) return 2.7
    if (score >= 72) return 2.3
    if (score >= 68) return 2.0
    if (score >= 64) return 1.5
    if (score >= 60) return 1.0
    return 0
  }

  private loadCheerio(html: string): any {
    // Simple HTML parser for browser environment
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return {
      find: (selector: string) => doc.querySelectorAll(selector),
      attr: (name: string) => doc.querySelector('[name]')?.getAttribute(name),
      text: () => doc.body?.textContent || '',
      querySelector: (selector: string) => doc.querySelector(selector),
      querySelectorAll: (selector: string) => doc.querySelectorAll(selector),
    }
  }

  // Proxy API calls (for backend services like grade distribution)
  async proxyGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.proxyClient.get(endpoint, { params })
  }

  async proxyPost<T>(endpoint: string, data?: any): Promise<T> {
    return this.proxyClient.post(endpoint, data)
  }
}

export const requestService = new RequestService()
export default requestService