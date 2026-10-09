import { createUploadTask, FileSystemUploadType } from "expo-file-system/legacy";
import { API } from "@/config";
import { ApiError, getToken } from "./http";

const safeJson = (t: string) => {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};

/**
 * Ham binary PUT (multipart DEĞİL). Video ve avatar yüklemesi için.
 * `fetch` büyük dosyada ilerleme vermez; native upload task verir.
 */
export async function uploadRaw<T = any>(
  path: string,
  fileUri: string,
  contentType: string,
  onProgress?: (ratio: number) => void,
): Promise<T> {
  const task = createUploadTask(
    API + path,
    fileUri,
    {
      httpMethod: "PUT",
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${getToken() ?? ""}`,
        "Content-Type": contentType,
        Accept: "application/json",
      },
    },
    ({ totalBytesSent, totalBytesExpectedToSend }) =>
      onProgress?.(totalBytesExpectedToSend ? totalBytesSent / totalBytesExpectedToSend : 0),
  );

  let res;
  try {
    res = await task.uploadAsync();
  } catch {
    throw new ApiError(0, "network_error", "Yükleme kesildi. İnternet bağlantını kontrol et.");
  }
  const data = res?.body ? safeJson(res.body) : null;
  if (!res || res.status < 200 || res.status >= 300) {
    throw new ApiError(
      res?.status ?? 0,
      data?.title ?? "upload_failed",
      data?.detail ?? "Yükleme başarısız oldu.",
      data,
    );
  }
  return data as T;
}
