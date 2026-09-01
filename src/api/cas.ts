import requestService from './request'
import type { CasLoginResult } from '@/types'

const EDU_SERVICE_URL = 'https://jwgl.whu.edu.cn/sso/jznewsixlogin'
const CAS_LOGIN_URL = 'https://cas.whu.edu.cn/authserver/login'

export class CasAuthService {
  static async login(): Promise<CasLoginResult> {
    // 直接跳转 CAS 官方登录页，登录成功后 CAS 会重定向回前端
    const service = encodeURIComponent(EDU_SERVICE_URL)
    const loginUrl = `https://cas.whu.edu.cn/authserver/login?service=${service}`
    
    // 返回登录 URL，前端直接跳转
    return {
      url: loginUrl,
      text: '',
      needsReAuth: false,
      reAuthUrl: undefined
    }
  }

  static async checkLoginStatus(): Promise<boolean> {
    const cookie = requestService.getCasCookie()
    if (!cookie) return false

    try {
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
    const service = encodeURIComponent(EDU_SERVICE_URL)
    return `https://cas.whu.edu.cn/authserver/login?service=${service}`
  }

  static async reAuthenticate(reAuthUrl: string): Promise<CasLoginResult> {
    // 直接使用原始 URL，不再走代理
    return {
      url: reAuthUrl,
      text: '',
      needsReAuth: false,
      reAuthUrl: undefined
    }
  }
}

export default CasAuthService