package ec.gob.banos.banostour;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(BiometricKeyPlugin.class);
    registerPlugin(DeviceSettingsPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
