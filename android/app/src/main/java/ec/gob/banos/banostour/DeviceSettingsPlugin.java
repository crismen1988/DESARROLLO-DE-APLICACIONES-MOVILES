package ec.gob.banos.banostour;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.location.Location;
import android.net.Uri;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceSettings")
public class DeviceSettingsPlugin extends Plugin {
  private static final String PERMISSION_PREFS = "banostour_permission_history";

  private String[] permissionsFor(String capability) {
    if ("location".equals(capability)) {
      return new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION };
    }
    return new String[] { Manifest.permission.CAMERA };
  }

  @PluginMethod
  public void getPermissionState(PluginCall call) {
    String capability = call.getString("capability", "camera");
    String[] permissions = permissionsFor(capability);
    boolean granted = false;
    boolean shouldExplain = false;
    for (String permission : permissions) {
      granted = granted || ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED;
      shouldExplain = shouldExplain || ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), permission);
    }
    boolean requested = getContext().getSharedPreferences(PERMISSION_PREFS, Context.MODE_PRIVATE)
      .getBoolean(capability, false);
    String state = granted ? "granted" : shouldExplain ? "denied" : requested ? "blocked" : "prompt";
    JSObject result = new JSObject();
    result.put("state", state);
    call.resolve(result);
  }

  @PluginMethod
  public void markPermissionRequested(PluginCall call) {
    String capability = call.getString("capability", "camera");
    getContext().getSharedPreferences(PERMISSION_PREFS, Context.MODE_PRIVATE)
      .edit().putBoolean(capability, true).apply();
    call.resolve();
  }

  @PluginMethod
  public void getLocationServiceState(PluginCall call) {
    LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
    boolean enabled = manager != null && (
      manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        || manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    );
    JSObject result = new JSObject();
    result.put("enabled", enabled);
    call.resolve(result);
  }

  @PluginMethod
  public void getLastKnownLocation(PluginCall call) {
    try {
      LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
      Location best = null;
      if (manager != null) {
        for (String provider : manager.getProviders(true)) {
          Location candidate = manager.getLastKnownLocation(provider);
          if (candidate == null) continue;
          if (best == null
            || candidate.getTime() > best.getTime()
            || (candidate.getTime() == best.getTime() && candidate.getAccuracy() < best.getAccuracy())) {
            best = candidate;
          }
        }
      }
      JSObject result = new JSObject();
      result.put("available", best != null);
      if (best != null) {
        result.put("latitude", best.getLatitude());
        result.put("longitude", best.getLongitude());
        result.put("accuracy", best.getAccuracy());
        result.put("timestamp", best.getTime());
      }
      call.resolve(result);
    } catch (SecurityException error) {
      call.reject("El permiso de ubicación no está concedido.", error);
    }
  }

  @PluginMethod
  public void openAppSettings(PluginCall call) {
    try {
      Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
      intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      call.resolve();
    } catch (Exception error) {
      call.reject("No se pudieron abrir los ajustes de la aplicación.", error);
    }
  }

  @PluginMethod
  public void openLocationSettings(PluginCall call) {
    try {
      Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      call.resolve();
    } catch (Exception error) {
      call.reject("No se pudieron abrir los ajustes de ubicación.", error);
    }
  }
}
