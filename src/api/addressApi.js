import axios from "axios";

// API chuẩn địa chỉ Việt Nam: https://provinces.open-api.vn/api/
const BASE_URL = "https://provinces.open-api.vn/api/v1";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 ngày

const cache = {
  provinces: null,
  provincesTime: 0,
  districtsAll: null,
  districtsAllTime: 0,
  wardsAll: null,
  wardsAllTime: 0,
};

const isCacheValid = (timestamp) =>
  timestamp && Date.now() - timestamp < CACHE_DURATION;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Lấy danh sách Tỉnh/Thành phố.
 * @returns {Promise<Array<{ code: number, name: string }>>}
 */
export const getProvinces = async () => {
  if (cache.provinces && isCacheValid(cache.provincesTime)) {
    return cache.provinces;
  }
  const res = await api.get("/");
  const list = Array.isArray(res.data) ? res.data : [];
  const normalized = list.map((p) => ({
    code: p.code,
    name: p.name || "",
  }));
  cache.provinces = normalized;
  cache.provincesTime = Date.now();
  return normalized;
};

/**
 * Lấy danh sách Quận/Huyện theo mã tỉnh.
 * @param {number|string} provinceCode
 * @returns {Promise<Array<{ code: number, name: string, province_code: number }>>}
 */
export const getDistrictsByProvinceCode = async (provinceCode) => {
  if (provinceCode === undefined || provinceCode === null || provinceCode === "")
    return [];
  const code = Number(provinceCode);
  if (!cache.districtsAll || !isCacheValid(cache.districtsAllTime)) {
    const res = await api.get("/d/");
    const list = Array.isArray(res.data) ? res.data : [];
    cache.districtsAll = list.map((d) => ({
      code: d.code,
      name: d.name || "",
      province_code: d.province_code,
    }));
    cache.districtsAllTime = Date.now();
  }
  return cache.districtsAll.filter((d) => d.province_code === code);
};

/**
 * Lấy danh sách Xã/Phường theo mã quận.
 * @param {number|string} districtCode
 * @returns {Promise<Array<{ code: number, name: string, district_code: number }>>}
 */
export const getWardsByDistrictCode = async (districtCode) => {
  if (
    districtCode === undefined ||
    districtCode === null ||
    districtCode === ""
  )
    return [];
  const code = Number(districtCode);
  if (!cache.wardsAll || !isCacheValid(cache.wardsAllTime)) {
    const res = await api.get("/w/");
    const list = Array.isArray(res.data) ? res.data : [];
    cache.wardsAll = list.map((w) => ({
      code: w.code,
      name: w.name || "",
      district_code: w.district_code,
    }));
    cache.wardsAllTime = Date.now();
  }
  return cache.wardsAll.filter((w) => w.district_code === code);
};

export default api;
