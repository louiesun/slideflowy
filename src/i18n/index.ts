import { NutstoreClientApi } from '../utils/NutstoreSDK';
import translations from './translates';
let cookieLang;
export const currLocale = () => {
    if (cookieLang) {
        return /^zh/.test(cookieLang) ? 'zh-cn' : 'en-us';
    }
    else {
        return 'zh-cn';
    }
};
export async function initI18n() {
    cookieLang = await NutstoreClientApi.create().getLocale();
    document.documentElement.lang = currLocale();
}
export const $t = (term) => translations[currLocale()][term] || term || '';
