import { PermissionsAndroid, Platform } from "react-native";

/**
 * Görüşme izinleri (rapor 8.1). İzin yoksa `join`'e hiç gidilmez.
 * iOS'ta mikrofon/kamera izni Agora ilk eriştiğinde sistem tarafından sorulur.
 */
export async function requestCallPermissions(video: boolean): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const wanted = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (video) wanted.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const res = await PermissionsAndroid.requestMultiple(wanted);
  return wanted.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED);
}
