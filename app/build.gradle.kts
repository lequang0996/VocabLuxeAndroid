import java.util.Properties

plugins {
    id("com.android.application")
}

// Thông tin ký bản phát hành: tạo file keystore.properties cạnh settings.gradle.kts
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.fws.vocabluxe"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.fws.vocabluxe"   // ĐỔI thành ID riêng của bạn trước khi đăng; không đổi được sau khi đã đăng
        minSdk = 26
        targetSdk = 36                         // Google Play yêu cầu API 36 từ 31/08/2026
        versionCode = 1
        versionName = "1.0.0"
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
