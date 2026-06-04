package com.lawapp.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册QQ登录插件
        registerPlugin(QQLoginPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
