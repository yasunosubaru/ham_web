import requestService from './request'
import type { CasLoginResult } from '@/types'

const EDU_SERVICE_URL = 'https://jwgl.whu.edu.cn/sso/jznewsixlogin'

export class CasAuthService {
  static async login(): Promise<CasLoginResult> {
    return requestService.casFastLogin(EDU_SERVICE_URL)
  }

  static async checkLoginStatus(): Promise<boolean> {
    const cookie = requestService.getCasCookie()
    if (!cookie) return false

    try {
      // Try to access a protected resource
      await requestService.get('/xtgl/index_cxYhxxIndex.html', {
        xt: 'jw',
        localeKey: 'zh_CN',
        gnmkdm: 'index',
      })
      return true
    } catch {
      return false
    }
  }

  static logout(): void {
    requestService.clearCasCookie()
    localStorage.removeItem('ham_user_info')
    localStorage.removeItem('ham_token')
  }

  static getLoginUrl(): string {
    return `${requestService['casClient'].defaults.baseURL}/authserver/login?service=${encodeURIComponent(EDU_SERVICE_URL)}`
  }

  static async reAuthenticate(reAuthUrl: string): Promise<CasLoginResult> {
    try {
      const response = await requestService['casClient'].get(reAuthUrl, { responseType: 'text' })
      return {
        url: response.request?.responseURL || reAuthUrl,
        text: response.data,
        needsReAuth: response.request?.responseURL?.includes('ReAuth') || false,
        reAuthUrl: response.request?.responseURL?.includes('ReAuth') ? response.request.responseURL : undefined,
      }
    } catch (error: any) {
      throw new Error(`重新认证失败: ${error.message}`)
    }
  }
}

export default CasAuthService