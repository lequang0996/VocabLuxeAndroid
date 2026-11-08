import java.util.Properties

plugins {
    id("com.android.application")
}

// Thông tin ký bản phát hành: tạo file keystore.properties cạnh settings.gradle.kts
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

// ID quảng cáo THỬ NGHIỆM do Google cung cấp (luôn trả về quảng cáo mẫu, an toàn để bấm thử).
// Bản debug luôn dùng ID thử nghiệm. Bản release dùng ID thật khi bạn truyền vào (gradle.properties hoặc -P...), nếu không thì vẫn là ID thử nghiệm:
//   ADMOB_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
//   ADMOB_BANNER_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
//   ADMOB_APP_OPEN_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
val TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713"
val TEST_BANNER_ID = "ca-app-pub-3940256099942544/9214589741"      // biểu ngữ thích ứng (adaptive banner)
val TEST_APP_OPEN_ID = "ca-app-pub-3940256099942544/9257395921"    // quảng cáo mở ứng dụng

android {
    namespace = "com.fws.vocabluxe"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.fws.vocabluxe"   // ĐỔI thành ID riêng của bạn trước khi đăng; không đổi được sau khi đã đăng
        minSdk = 26
        targetSdk = 36                         // Google Play yêu cầu API 36 từ 31/08/2026
        versionCode = 1
        versionName = "1.0.0"

        manifestPlaceholders["admobAppId"] = TEST_APP_ID
        buildConfigField("String", "ADMOB_BANNER_ID", "\"$TEST_BANNER_ID\"")
        buildConfigField("String", "ADMOB_APP_OPEN_ID", "\"$TEST_APP_OPEN_ID\"")
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (keystoreProps.getProperty("storeFile") != null) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfigs.findByName("release")?.let { signingConfig = it }
            (findProperty("ADMOB_APP_ID") as String?)?.let { manifestPlaceholders["admobAppId"] = it }
            (findProperty("ADMOB_BANNER_ID") as String?)?.let { buildConfigField("String", "ADMOB_BANNER_ID", "\"$it\"") }
            (findProperty("ADMOB_APP_OPEN_ID") as String?)?.let { buildConfigField("String", "ADMOB_APP_OPEN_ID", "\"$it\"") }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = false
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.core:core:1.15.0")
    implementation("com.google.android.play:app-update:2.1.0")   // Cập nhật trong ứng dụng (In-App Updates, kiểu Flexible)
    implementation("com.google.android.gms:play-services-ads:25.4.0")   // AdMob: biểu ngữ + quảng cáo mở ứng dụng (đã kèm UMP xin đồng ý)
    implementation("androidx.lifecycle:lifecycle-process:2.8.7")        // Biết khi cả ứng dụng quay lại nền trước (cho quảng cáo mở ứng dụng)

    // Sửa lỗi "Duplicate class kotlin.collections.jdk8..." khi build:
    // từ Kotlin 1.8, kotlin-stdlib-jdk7/jdk8 đã gộp vào kotlin-stdlib. Một thư viện phụ thuộc vẫn kéo bản cũ 1.6.21
    // nên ép hai gói này lên 1.8.22 (bản rỗng, chỉ trỏ về kotlin-stdlib) để không còn class trùng.
    constraints {
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22") {
            because("kotlin-stdlib-jdk7 đã là một phần của kotlin-stdlib")
        }
        implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22") {
            because("kotlin-stdlib-jdk8 đã là một phần của kotlin-stdlib")
        }
    }
}
