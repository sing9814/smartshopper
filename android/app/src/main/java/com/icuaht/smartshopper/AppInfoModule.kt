package com.icuaht.smartshopper

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class AppInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppInfo"

    override fun getConstants(): MutableMap<String, Any> =
        hashMapOf(
            "versionName" to BuildConfig.VERSION_NAME,
            "buildNumber" to BuildConfig.VERSION_CODE.toString(),
        )
}
