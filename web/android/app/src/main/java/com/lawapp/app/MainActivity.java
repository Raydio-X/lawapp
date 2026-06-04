package com.lawapp.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册QQ登录插件
        registerPlugin(QQLoginPlugin.class);
        super.onCreate(savedInstanceState);
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
