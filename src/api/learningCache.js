const courseDetailCache = new Map();
const courseStructureCache = new Map();
const learningProcessCache = new Map();
let lessonViewCache = null;
let myCoursesCache = null;
let myCoursesStale = false;

const toKey = (courseId) => String(courseId ?? '');

export const getCachedCourseDetail = (courseId) => {
  const key = toKey(courseId);
  if (!key) return null;
  return courseDetailCache.get(key) ?? null;
};

export const setCachedCourseDetail = (courseId, detail) => {
  const key = toKey(courseId);
  if (!key || !detail) return;
  courseDetailCache.set(key, detail);
};

export const getCachedCourseStructure = (courseId) => {
  const key = toKey(courseId);
  if (!key) return null;
  return courseStructureCache.get(key) ?? null;
};

export const setCachedCourseStructure = (courseId, structure) => {
  const key = toKey(courseId);
  if (!key || !structure) return;
  courseStructureCache.set(key, structure);
};

export const invalidateCachedCourseStructure = (courseId) => {
  const key = toKey(courseId);
  if (!key) return;
  courseStructureCache.delete(key);
};

export const getCachedLearningProcess = (courseId) => {
  const key = toKey(courseId);
  if (!key) return null;
  return learningProcessCache.get(key) ?? null;
};

export const setCachedLearningProcess = (courseId, process) => {
  const key = toKey(courseId);
  if (!key || !process) return;
  learningProcessCache.set(key, process);
};

export const invalidateCachedLearningProcess = (courseId) => {
  const key = toKey(courseId);
  if (!key) return;
  learningProcessCache.delete(key);
};

export const getCachedLessonView = () => lessonViewCache;

export const setCachedLessonView = (lessons) => {
  if (!Array.isArray(lessons)) return;
  lessonViewCache = lessons;
};

export const clearAllLearningCaches = () => {
  courseDetailCache.clear();
  courseStructureCache.clear();
  learningProcessCache.clear();
  lessonViewCache = null;
  myCoursesCache = null;
  myCoursesStale = false;
};

export const getCachedMyCourses = () => {
  if (myCoursesStale) return null;
  return Array.isArray(myCoursesCache) ? myCoursesCache : null;
};

export const setCachedMyCourses = (courses) => {
  myCoursesCache = Array.isArray(courses) ? courses : null;
  myCoursesStale = false;
};

export const invalidateCachedMyCourses = () => {
  myCoursesStale = true;
};
