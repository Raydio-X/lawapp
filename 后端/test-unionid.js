/**
 * 测试 QQ unionId 接口
 * 使用方法：node test-unionid.js <access_token>
 */

const accessToken = process.argv[2];

if (!accessToken) {
    console.log('使用方法：node test-unionid.js <access_token>');
    console.log('\n获取 access_token 的方法：');
    console.log('1. 在浏览器访问 QQ 登录授权页面');
    console.log('2. 授权后会跳转到回调页面，URL中包含 access_token');
    process.exit(1);
}

async function testUnionId() {
    try {
        console.log('测试获取 unionId...\n');
        
        // 测试 get_unionid 接口
        const unionidUrl = `https://graph.qq.com/user/get_unionid?access_token=${accessToken}`;
        console.log('请求 URL:', unionidUrl);
        
        const response = await fetch(unionidUrl);
        const data = await response.json();
        
        console.log('\n返回结果:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.unionid) {
            console.log('\n✅ unionId 获取成功！');
            console.log('unionId:', data.unionid);
            console.log('client_id:', data.client_id);
            console.log('openid:', data.openid);
        } else if (data.error) {
            console.log('\n❌ unionId 获取失败');
            console.log('错误码:', data.error);
            console.log('错误信息:', data.error_description);
            console.log('\n可能原因：');
            console.log('1. 未申请开通 unionId 权限');
            console.log('2. access_token 无效或已过期');
            console.log('3. 应用未通过审核');
        }
        
        // 同时测试 get_user_info 接口
        console.log('\n\n测试获取用户信息...\n');
        const userInfoUrl = `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${data.client_id || '1904114043'}&openid=${data.openid || ''}`;
        const userInfoResponse = await fetch(userInfoUrl);
        const userInfo = await userInfoResponse.json();
        
        console.log('用户信息:');
        console.log(JSON.stringify(userInfo, null, 2));
        
    } catch (error) {
        console.error('请求失败:', error.message);
    }
}

testUnionId();
