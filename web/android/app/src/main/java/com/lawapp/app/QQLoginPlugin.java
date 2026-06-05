package com.lawapp.app;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tencent.tauth.IUiListener;
import com.tencent.tauth.Tencent;
import com.tencent.tauth.UiError;

import org.json.JSONObject;

@CapacitorPlugin(name = "QQLogin")
public class QQLoginPlugin extends Plugin {
    private static final String TAG = "QQLoginPlugin";
    private Tencent mTencent;
    private String appId;
    private PluginCall savedCall;
    
    // 静态实例，用于在 MainActivity 中访问
    private static QQLoginPlugin instance;
    private static IUiListener staticLoginListener;

    private final IUiListener loginListener = new IUiListener() {
        @Override
        public void onComplete(Object response) {
            Log.d(TAG, "QQ login onComplete: " + response.toString());
            try {
                JSONObject jsonResponse = (JSONObject) response;
                String openId = jsonResponse.optString("openid");
                String accessToken = jsonResponse.optString("access_token");
                long expiresIn = jsonResponse.optLong("expires_in");

                if (openId == null || openId.isEmpty() || accessToken == null || accessToken.isEmpty()) {
                    Log.e(TAG, "Invalid login response: openId or accessToken is empty");
                    handleError("登录失败：获取用户信息不完整");
                    return;
                }

                // 保存token
                mTencent.setOpenId(openId);
                mTencent.setAccessToken(accessToken, String.valueOf(expiresIn));

                // 获取UnionID（用于跨平台识别同一用户）
                fetchUnionId(accessToken, openId, expiresIn);
            } catch (Exception e) {
                Log.e(TAG, "Parse login response error: " + e.getMessage());
                handleError("解析登录结果失败: " + e.getMessage());
            }
        }

        @Override
        public void onError(UiError error) {
            Log.e(TAG, "QQ login onError: " + error.errorCode + " - " + error.errorMessage);
            String errorMessage = getErrorMessage(error.errorCode, error.errorMessage);
            handleError(errorMessage);
        }

        @Override
        public void onCancel() {
            Log.d(TAG, "QQ login onCancel");
            handleError("用户取消登录");
        }

        @Override
        public void onWarning(int code) {
            Log.w(TAG, "QQ login onWarning: " + code);
            // 警告通常不需要特殊处理，但记录日志
        }
    };
    
    // 静态方法：处理 onActivityResult
    public static void handleQQActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "handleQQActivityResult: requestCode=" + requestCode + ", resultCode=" + resultCode);
        if (staticLoginListener != null) {
            Tencent.onActivityResultData(requestCode, resultCode, data, staticLoginListener);
        } else {
            Log.w(TAG, "staticLoginListener is null");
        }
    }

    @Override
    public void load() {
        super.load();
        
        // 设置静态实例和 listener
        instance = this;
        staticLoginListener = loginListener;
        
        // 添加调试日志
        Log.d(TAG, "=== QQLoginPlugin load() ===");
        
        // 尝试获取配置
        try {
            appId = getConfig().getString("appId", "");
            String appKey = getConfig().getString("appKey", "");
            Log.d(TAG, "appId from config: " + appId);
            Log.d(TAG, "appKey from config: " + appKey);
        } catch (Exception e) {
            Log.e(TAG, "Error reading config: " + e.getMessage());
        }
        
        // 如果配置中没有appId，使用默认值
        if (appId == null || appId.isEmpty()) {
            appId = "1904114043"; // 移动端APP ID
            Log.w(TAG, "Using default appId: " + appId);
        }
        
        if (!appId.isEmpty()) {
            mTencent = Tencent.createInstance(appId, getContext());
            
            // 设置用户已授权使用设备信息（解决错误码 -6）
            Tencent.setIsPermissionGranted(true, Build.MODEL);
            Log.d(TAG, "Permission granted for device info");
            
            Log.d(TAG, "QQ SDK initialized with appId: " + appId);
        } else {
            Log.e(TAG, "QQ appId not configured!");
        }
    }

    @PluginMethod
    public void login(PluginCall call) {
        // 检查网络连接
        if (!isNetworkAvailable()) {
            call.reject("网络不可用，请检查网络连接");
            return;
        }

        if (mTencent == null) {
            call.reject("QQ SDK未初始化，请检查appId配置");
            return;
        }

        savedCall = call;

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                Log.d(TAG, "Starting QQ login...");
                mTencent.login(getBridge().getActivity(), "get_user_info", loginListener);
            } catch (Exception e) {
                Log.e(TAG, "Login error: " + e.getMessage(), e);
                call.reject("启动QQ登录失败: " + e.getMessage());
                savedCall = null;
            }
        });
    }

    @PluginMethod
    public void logout(PluginCall call) {
        if (mTencent != null) {
            mTencent.logout(getContext());
        }
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @PluginMethod
    public void isLoggedIn(PluginCall call) {
        JSObject result = new JSObject();
        boolean loggedIn = mTencent != null && mTencent.isSessionValid();
        result.put("isLoggedIn", loggedIn);
        if (loggedIn) {
            result.put("openId", mTencent.getOpenId());
            result.put("accessToken", mTencent.getAccessToken());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void getUserInfo(PluginCall call) {
        if (mTencent == null || !mTencent.isSessionValid()) {
            call.reject("未登录");
            return;
        }

        savedCall = call;

        getBridge().getActivity().runOnUiThread(() -> {
            try {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("openId", mTencent.getOpenId());
                result.put("accessToken", mTencent.getAccessToken());
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "Get user info error: " + e.getMessage());
                call.reject("获取用户信息失败: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void checkSupport(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isSupported", mTencent != null);
        result.put("appId", appId != null ? appId : "");
        result.put("hasNetwork", isNetworkAvailable());
        call.resolve(result);
    }

    /**
     * 获取UnionID（用于跨平台识别同一用户）
     */
    private void fetchUnionId(String accessToken, String openId, long expiresIn) {
        new Thread(() -> {
            String unionId = null;
            try {
                // 使用正确的QQ API获取UnionID
                String unionIdUrl = "https://graph.qq.com/oauth2.0/me?access_token=" + accessToken + "&unionid=1&fmt=json";
                java.net.URL url = new java.net.URL(unionIdUrl);
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);

                int responseCode = connection.getResponseCode();
                Log.d(TAG, "UnionID API response code: " + responseCode);

                if (responseCode == 200) {
                    java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                    reader.close();

                    String responseStr = response.toString();
                    Log.d(TAG, "UnionID API response: " + responseStr);
                    
                    // 尝试解析JSON响应
                    try {
                        JSONObject unionIdResponse = new JSONObject(responseStr);
                        unionId = unionIdResponse.optString("unionid");
                        Log.d(TAG, "UnionID: " + unionId);
                    } catch (Exception e) {
                        // 如果不是JSON，可能是JSONP格式，尝试提取
                        Log.w(TAG, "Response is not JSON, trying to extract unionid");
                        if (responseStr.contains("\"unionid\"")) {
                            int start = responseStr.indexOf("\"unionid\":\"") + 11;
                            int end = responseStr.indexOf("\"", start);
                            if (start > 10 && end > start) {
                                unionId = responseStr.substring(start, end);
                                Log.d(TAG, "UnionID (extracted): " + unionId);
                            }
                        }
                    }
                }

                connection.disconnect();

            } catch (Exception e) {
                Log.e(TAG, "Failed to fetch UnionID: " + e.getMessage());
                Log.w(TAG, "提示：确保应用已在QQ互联平台申请UnionID权限");
            }

            // 使用final变量传递unionId
            final String finalUnionId = unionId;
            
            // 返回结果给前端
            getBridge().getActivity().runOnUiThread(() -> {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("openId", openId);
                result.put("accessToken", accessToken);
                result.put("expiresIn", expiresIn);
                if (finalUnionId != null && !finalUnionId.isEmpty()) {
                    result.put("unionId", finalUnionId);
                    Log.d(TAG, "Returning unionId: " + finalUnionId);
                } else {
                    Log.w(TAG, "UnionID is null or empty, check QQ connect platform configuration");
                }

                if (savedCall != null) {
                    savedCall.resolve(result);
                    savedCall = null;
                }
            });
        }).start();
    }

    private void handleError(String message) {
        if (savedCall != null) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", message);
            savedCall.resolve(result);
            savedCall = null;
        }
    }

    private String getErrorMessage(int errorCode, String defaultMessage) {
        switch (errorCode) {
            case 1:
                return "QQ客户端未安装或版本过低";
            case 2:
                return "网络连接失败，请检查网络";
            case 3:
                return "应用配置错误，请检查APP ID";
            case 4:
                return "用户取消登录";
            case 5:
                return "登录超时，请重试";
            case 6:
                return "QQ授权失败";
            case 7:
                return "应用签名不匹配，请检查签名配置";
            default:
                return defaultMessage != null && !defaultMessage.isEmpty() 
                    ? defaultMessage 
                    : "登录失败，错误码: " + errorCode;
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext()
                .getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                NetworkInfo networkInfo = cm.getActiveNetworkInfo();
                return networkInfo != null && networkInfo.isConnected();
            }
        } catch (Exception e) {
            Log.e(TAG, "Check network error: " + e.getMessage());
        }
        return false;
    }

    @Override
    public void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "handleOnActivityResult: requestCode=" + requestCode + ", resultCode=" + resultCode);
        if (mTencent != null) {
            Tencent.onActivityResultData(requestCode, resultCode, data, loginListener);
        }
        super.handleOnActivityResult(requestCode, resultCode, data);
    }
}
