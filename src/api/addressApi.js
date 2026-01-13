import axios from "axios";

// API từ vietnamlabs.com
const VIETNAM_LABS_API = "https://vietnamlabs.com/api/vietnamprovince";

// Keys cho localStorage
const PROVINCES_CACHE_KEY = "vietnam_provinces_cache";
const PROVINCES_TIMESTAMP_KEY = "vietnam_provinces_timestamp";
const WARDS_CACHE_KEY_PREFIX = "vietnam_wards_";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 ngày (milliseconds)

// Mock data fallback
const MOCK_PROVINCES = [
  { id: "01", name: "Hà Nội" },
  { id: "02", name: "Hồ Chí Minh" },
  { id: "03", name: "Đà Nẵng" },
  { id: "04", name: "Hải Phòng" },
  { id: "05", name: "Cần Thơ" },
  { id: "06", name: "An Giang" },
  { id: "07", name: "Bà Rịa - Vũng Tàu" },
  { id: "08", name: "Bắc Giang" },
  { id: "09", name: "Bắc Kạn" },
  { id: "10", name: "Bạc Liêu" },
];

const MOCK_COMMUNES = [
  { id: "ward-1", name: "Phường 1" },
  { id: "ward-2", name: "Phường 2" },
  { id: "ward-3", name: "Phường 3" },
  { id: "ward-4", name: "Xã 1" },
  { id: "ward-5", name: "Xã 2" },
];

// Kiểm tra cache có còn hiệu lực không
const isCacheValid = (timestampKey) => {
  try {
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    return (now - cacheTime) < CACHE_DURATION;
  } catch (error) {
    return false;
  }
};

// Lấy danh sách tỉnh/thành mới nhất (với cache)
export const getProvincesApi = async () => {
  // Kiểm tra cache trước
  try {
    const cachedData = localStorage.getItem(PROVINCES_CACHE_KEY);
    if (cachedData && isCacheValid(PROVINCES_TIMESTAMP_KEY)) {
      console.log("Using cached provinces data");
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.warn("Error reading provinces cache:", error);
  }

  // Nếu không có cache hoặc cache hết hạn, gọi API
  try {
    console.log("Fetching provinces from vietnamlabs.com");
    const response = await axios.get(VIETNAM_LABS_API, {
      timeout: 10000 // 10 giây timeout
    });
    
    if (!response.data.success || !response.data.data) {
      console.warn("Invalid API response, checking cache or using mock data");
      // Thử dùng cache cũ nếu có
      try {
        const oldCache = localStorage.getItem(PROVINCES_CACHE_KEY);
        if (oldCache) {
          console.log("Using old cached data");
          return JSON.parse(oldCache);
        }
      } catch (e) {
        // Ignore
      }
      return MOCK_PROVINCES;
    }
    
    const provinces = response.data.data.map((province) => ({
      id: province.id,
      name: province.province
    }));
    
    // Lưu vào cache
    try {
      localStorage.setItem(PROVINCES_CACHE_KEY, JSON.stringify(provinces));
      localStorage.setItem(PROVINCES_TIMESTAMP_KEY, Date.now().toString());
      console.log(`Cached ${provinces.length} provinces`);
    } catch (error) {
      console.warn("Error saving provinces to cache:", error);
    }
    
    console.log(`Fetched ${provinces.length} provinces from vietnamlabs.com`);
    return provinces;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    
    // Thử dùng cache cũ nếu có
    try {
      const oldCache = localStorage.getItem(PROVINCES_CACHE_KEY);
      if (oldCache) {
        console.log("Using old cached data due to network error");
        return JSON.parse(oldCache);
      }
    } catch (e) {
      // Ignore
    }
    
    console.warn("Using mock data as fallback");
    return MOCK_PROVINCES;
  }
};

// Lấy danh sách xã/phường thuộc một tỉnh (với cache)
export const getCommunesApi = async (provinceId) => {
  if (!provinceId) {
    return MOCK_COMMUNES;
  }

  const cacheKey = `${WARDS_CACHE_KEY_PREFIX}${provinceId}`;
  const timestampKey = `${WARDS_CACHE_KEY_PREFIX}${provinceId}_timestamp`;

  // Kiểm tra cache trước
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData && isCacheValid(timestampKey)) {
      console.log(`Using cached wards data for province ${provinceId}`);
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.warn("Error reading wards cache:", error);
  }

  // Nếu không có cache hoặc cache hết hạn, gọi API
  try {
    console.log(`Fetching communes for province ID: ${provinceId}`);
    const response = await axios.get(VIETNAM_LABS_API, {
      timeout: 10000 // 10 giây timeout
    });
    
    if (!response.data.success || !response.data.data) {
      console.warn("Invalid API response, checking cache or using mock data");
      // Thử dùng cache cũ nếu có
      try {
        const oldCache = localStorage.getItem(cacheKey);
        if (oldCache) {
          console.log("Using old cached wards data");
          return JSON.parse(oldCache);
        }
      } catch (e) {
        // Ignore
      }
      return MOCK_COMMUNES;
    }
    
    const province = response.data.data.find(p => p.id === provinceId);
    if (!province || !province.wards) {
      console.warn(`Province ID ${provinceId} not found or has no wards`);
      // Thử dùng cache cũ nếu có
      try {
        const oldCache = localStorage.getItem(cacheKey);
        if (oldCache) {
          console.log("Using old cached wards data");
          return JSON.parse(oldCache);
        }
      } catch (e) {
        // Ignore
      }
      return MOCK_COMMUNES;
    }
    
    const communes = province.wards.map((ward, index) => ({
      id: `${provinceId}-${index}`,
      name: ward.name
    }));
    
    // Lưu vào cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(communes));
      localStorage.setItem(timestampKey, Date.now().toString());
      console.log(`Cached ${communes.length} wards for province ${provinceId}`);
    } catch (error) {
      console.warn("Error saving wards to cache:", error);
    }
    
    console.log(`Found ${communes.length} wards in ${province.province}`);
    return communes;
  } catch (error) {
    console.error("Error fetching communes:", error);
    
    // Thử dùng cache cũ nếu có
    try {
      const oldCache = localStorage.getItem(cacheKey);
      if (oldCache) {
        console.log("Using old cached wards data due to network error");
        return JSON.parse(oldCache);
      }
    } catch (e) {
      // Ignore
    }
    
    console.warn("Using mock data as fallback");
    return MOCK_COMMUNES;
  }
};

// Export với tên mà RegisterPage đang sử dụng
export const getAllProvinces = getProvincesApi;
export const getWardsByProvince = getCommunesApi;



export default axios.create({
  baseURL: VIETNAM_LABS_API,
  headers: {
    "Content-Type": "application/json"
  }
});

