package com.example.pc_libo.webviewdemo;

import android.content.Context;
import android.os.Handler;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends AppCompatActivity {

    //效果：点击时Log会打印输出内容
    private static final String LOG_TAG = "WebViewDemo";

    private Context mContext;

    private WebView mWebView;

    private Handler mHandler = new Handler();

    @Override
    public void onCreate(Bundle icicle) {
        super.onCreate(icicle);
        setContentView(R.layout.activity_main);
        mContext = this;
        mWebView = (WebView) findViewById(R.id.webview);


        WebSettings webSettings = mWebView.getSettings();
        webSettings.setSaveFormData(false);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setSupportZoom(false);

        mWebView.setWebViewClient(new WebViewClient(){
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
               WebResourceResponse response = new WebResourceResponse("ad","UTF-8",null);
                return response;
            }
        });

        mWebView.setWebChromeClient(new MyWebChromeClient());

        mWebView.addJavascriptInterface(new DemoJavaScriptInterface(), "demo");

        mWebView.loadUrl("file:/android_asset/word_cloud/demo.html");
//        mWebView.loadUrl("https://www.baidu.com/");
//        String summary = "<html><body>You scored <b>192</b> points.</body></html>";
//        mWebView.loadData(summary , "text/html" ,null);


//        mWebView.addJavascriptInterface(new JsObject(), "injectedObject");
//        mWebView.loadData("", "text/html", null);
//        mWebView.loadUrl("javascript:alert(injectedObject.toString())");
    }


    class JsObject {
        @JavascriptInterface
        public String toString() { return "injectedObject"; }
    }



    final class DemoJavaScriptInterface {
        @JavascriptInterface

        /**
         * This is not called on the UI thread. Post a runnable to invoke
         * loadUrl on the UI thread.
         */
        public void clickOnAndroid() {
            mHandler.post(new Runnable() {
                public void run() {
                    mWebView.loadUrl("javascript:wave()");
                }
            });

        }
    }

    /**
     * Provides a hook for calling "alert" from javascript. Useful for
     * debugging your javascript.
     */
    final class MyWebChromeClient extends WebChromeClient {
        @Override
        public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
            Log.d(LOG_TAG, message);
            result.confirm();
            Toast.makeText(mContext ,"nihao" ,Toast.LENGTH_SHORT).show();
            return true;
        }
    }
}
