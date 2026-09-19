package dev.navirox.vuepilot;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

// The androidTest entrypoint Detox drives. `detox test --configuration android.emu.debug`
// installs the app plus this test APK (assembleAndroidTest) and runs it on the emulator.
// Without it the androidTest APK falls back to the legacy android.test runner, whose
// classPath scan of every dex entry ANRs the app before Detox can connect.
@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule =
            new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);
        Detox.runTests(mActivityRule, detoxConfig);
    }
}
