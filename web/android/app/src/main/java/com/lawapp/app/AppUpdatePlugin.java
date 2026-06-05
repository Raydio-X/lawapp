package com.lawapp.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private static final String TAG = "AppUpdatePlugin";
    private static final int REQUEST_INSTALL_PERMISSION = 1001;
    
    private Long downloadId = null;
    private String downloadFilePath = null;
    private PluginCall pendingCall = null;
    
    private BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long receivedDownloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            
            if (downloadId != null && receivedDownloadId == downloadId) {
                Log.d(TAG, "下载完成: downloadId=" + downloadId);
                handleDownloadComplete();
            }
        }
    };

    @Override
    public void load() {
        // 注册下载完成广播接收器
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
        Log.d(TAG, "AppUpdatePlugin 已加载");
    }

    @Override
    protected void handleOnDestroy() {
        try {
            getContext().unregisterReceiver(downloadReceiver);
        } catch (Exception e) {
            Log.e(TAG, "注销广播接收器失败: " + e.getMessage());
        }
        super.handleOnDestroy();
    }

    /**
     * 下载并安装 APK
     */
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String versionName = call.getString("versionName", "latest");
        
        if (url == null || url.isEmpty()) {
            call.reject("下载地址不能为空");
            return;
        }
        
        Log.d(TAG, "开始下载 APK: " + url);
        
        pendingCall = call;
        
        try {
            // 使用系统 DownloadManager 下载
            DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            
            // 创建下载目录
            File downloadDir = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "updates");
            if (!downloadDir.exists()) {
                downloadDir.mkdirs();
            }
            
            // 删除旧的 APK 文件
            File[] oldFiles = downloadDir.listFiles();
            if (oldFiles != null) {
                for (File file : oldFiles) {
                    if (file.getName().endsWith(".apk")) {
                        file.delete();
                    }
                }
            }
            
            // 创建下载请求
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("律卡更新 v" + versionName);
            request.setDescription("正在下载新版本...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "updates/lawapp-" + versionName + ".apk");
            request.setMimeType("application/vnd.android.package-archive");
            
            // 允许移动网络下载
            request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI | DownloadManager.Request.NETWORK_MOBILE);
            request.setAllowedOverRoaming(true);
            
            // 开始下载
            downloadId = downloadManager.enqueue(request);
            
            Log.d(TAG, "下载任务已创建: downloadId=" + downloadId);
            
            // 启动进度监控
            monitorDownloadProgress(downloadManager, downloadId, call);
            
        } catch (Exception e) {
            Log.e(TAG, "启动下载失败: " + e.getMessage());
            call.reject("启动下载失败: " + e.getMessage());
        }
    }

    /**
     * 监控下载进度
     */
    private void monitorDownloadProgress(DownloadManager downloadManager, long downloadId, PluginCall call) {
        new Thread(() -> {
            boolean downloading = true;
            
            while (downloading) {
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);
                
                Cursor cursor = downloadManager.query(query);
                if (cursor.moveToFirst()) {
                    int bytesDownloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                    int totalSizeIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);
                    int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                    
                    if (bytesDownloadedIndex != -1 && totalSizeIndex != -1 && statusIndex != -1) {
                        int bytesDownloaded = cursor.getInt(bytesDownloadedIndex);
                        int totalSize = cursor.getInt(totalSizeIndex);
                        int status = cursor.getInt(statusIndex);
                        
                        if (totalSize > 0) {
                            int progress = (int) ((bytesDownloaded * 100L) / totalSize);
                            
                            // 通知前端进度
                            JSObject progressData = new JSObject();
                            progressData.put("progress", progress);
                            notifyListeners("downloadProgress", progressData);
                        }
                        
                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            downloading = false;
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            downloading = false;
                            int reasonIndex = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                            int reason = reasonIndex != -1 ? cursor.getInt(reasonIndex) : -1;
                            Log.e(TAG, "下载失败，原因: " + reason);
                        }
                    }
                }
                cursor.close();
                
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }).start();
    }

    /**
     * 处理下载完成
     */
    private void handleDownloadComplete() {
        if (downloadId == null) return;
        
        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query();
        query.setFilterById(downloadId);
        
        Cursor cursor = downloadManager.query(query);
        if (cursor.moveToFirst()) {
            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            int uriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
            
            if (statusIndex != -1 && uriIndex != -1) {
                int status = cursor.getInt(statusIndex);
                String localUri = cursor.getString(uriIndex);
                
                if (status == DownloadManager.STATUS_SUCCESSFUL && localUri != null) {
                    Log.d(TAG, "APK 下载成功: " + localUri);
                    downloadFilePath = localUri;
                    
                    // 安装 APK
                    installApk(Uri.parse(localUri));
                } else {
                    Log.e(TAG, "下载失败，状态: " + status);
                    if (pendingCall != null) {
                        pendingCall.reject("下载失败");
                        pendingCall = null;
                    }
                }
            }
        }
        cursor.close();
    }

    /**
     * 安装 APK
     */
    private void installApk(Uri apkUri) {
        try {
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Android 7.0+ 使用 FileProvider
                File apkFile = new File(apkUri.getPath());
                Uri contentUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );
                
                installIntent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            }
            
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            Log.d(TAG, "启动安装界面");
            getContext().startActivity(installIntent);
            
            // 通知前端安装已启动
            if (pendingCall != null) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "安装已启动");
                pendingCall.resolve(result);
                pendingCall = null;
            }
            
        } catch (Exception e) {
            Log.e(TAG, "安装 APK 失败: " + e.getMessage());
            if (pendingCall != null) {
                pendingCall.reject("安装失败: " + e.getMessage());
                pendingCall = null;
            }
        }
    }

    /**
     * 检查是否有安装权限
     */
    @PluginMethod
    public void checkInstallPermission(PluginCall call) {
        boolean hasPermission = false;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            hasPermission = getContext().getPackageManager().canRequestPackageInstalls();
        } else {
            hasPermission = true;
        }
        
        JSObject result = new JSObject();
        result.put("hasPermission", hasPermission);
        call.resolve(result);
    }

    /**
     * 请求安装权限
     */
    @PluginMethod
    public void requestInstallPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        
        call.resolve();
    }

    /**
     * 打开应用详情页（用于权限设置）
     */
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        intent.setData(Uri.parse("package:" + getContext().getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
