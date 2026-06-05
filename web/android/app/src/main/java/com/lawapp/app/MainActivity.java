package com.lawapp.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册QQ登录插件
        registerPlugin(QQLoginPlugin.class);
        // 注册应用更新插件
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        
        // 允许WebView加载混合内容（HTTPS页面加载HTTP资源，如QQ头像）
        configureWebViewForMixedContent();
    }
    
    private void configureWebViewForMixedContent() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                // 允许混合内容模式（允许HTTPS页面加载HTTP资源）
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                // 允许文件访问
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                Log.d(TAG, "WebView混合内容已启用");
            }
        } catch (Exception e) {
            Log.e(TAG, "配置WebView失败: " + e.getMessage());
        }
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "=== onActivityResult ===");
        Log.d(TAG, "requestCode: " + requestCode);
        Log.d(TAG, "resultCode: " + resultCode);
        Log.d(TAG, "data: " + (data != null ? data.toString() : "null"));
        
        // 调用 QQLoginPlugin 的静态方法处理 QQ 登录回调
        QQLoginPlugin.handleQQActivityResult(requestCode, resultCode, data);
        
        super.onActivityResult(requestCode, resultCode, data);
    }
}
