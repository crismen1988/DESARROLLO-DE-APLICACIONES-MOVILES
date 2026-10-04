package ec.gob.banos.banostour;

import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "BiometricKey")
public class BiometricKeyPlugin extends Plugin {
  private static final String KEYSTORE = "AndroidKeyStore";
  private static final String ALIAS = "banostour.biometric.signing.v1";
  private final AtomicBoolean signingInProgress = new AtomicBoolean(false);

  @PluginMethod
  public void enroll(PluginCall call) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) { call.reject("Biometría no compatible en este dispositivo."); return; }
    try {
      KeyStore store = KeyStore.getInstance(KEYSTORE);
      store.load(null);
      if (!store.containsAlias(ALIAS)) {
        KeyPairGenerator generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE);
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
          .setDigests(KeyProperties.DIGEST_SHA256)
          .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
          .setUserAuthenticationRequired(true)
          .setInvalidatedByBiometricEnrollment(true)
          .build();
        generator.initialize(spec);
        generator.generateKeyPair();
      }
      KeyPair pair = new KeyPair(store.getCertificate(ALIAS).getPublicKey(), (PrivateKey) store.getKey(ALIAS, null));
      JSObject result = new JSObject();
      result.put("keyId", ALIAS);
      result.put("publicKey", Base64.encodeToString(pair.getPublic().getEncoded(), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING));
      call.resolve(result);
    } catch (Exception error) { call.reject("No se pudo preparar la clave biométrica.", error); }
  }

  @PluginMethod
  public void removeKey(PluginCall call) {
    try {
      KeyStore store = KeyStore.getInstance(KEYSTORE);
      store.load(null);
      if (store.containsAlias(ALIAS)) store.deleteEntry(ALIAS);
      call.resolve();
    } catch (Exception error) { call.reject("No se pudo eliminar la clave biométrica.", error); }
  }

  @PluginMethod
  @RequiresApi(api = Build.VERSION_CODES.P)
  public void sign(PluginCall call) {
    if (!signingInProgress.compareAndSet(false, true)) {
      call.reject("Ya hay una autenticación biométrica en curso.");
      return;
    }
    String encodedChallenge = call.getString("challenge");
    if (encodedChallenge == null) {
      signingInProgress.set(false);
      call.reject("Desafío biométrico inválido.");
      return;
    }
    try {
      KeyStore store = KeyStore.getInstance(KEYSTORE); store.load(null);
      PrivateKey key = (PrivateKey) store.getKey(ALIAS, null);
      if (key == null) { call.reject("Este dispositivo no está vinculado a una cuenta."); return; }
      Signature signature = Signature.getInstance("SHA256withECDSA");
      signature.initSign(key);
      byte[] challenge = Base64.decode(encodedChallenge, Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING);
      Executor executor = getActivity().getMainExecutor();
      BiometricPrompt prompt = new BiometricPrompt.Builder(getActivity())
        .setTitle("Acceso seguro a BañosTour")
        .setSubtitle("Confirma tu identidad con biometría")
        .setNegativeButton("Cancelar", executor, (dialog, which) -> rejectSigning(call, "Autenticación cancelada."))
        .build();
      prompt.authenticate(new BiometricPrompt.CryptoObject(signature), new CancellationSignal(), executor,
        new BiometricPrompt.AuthenticationCallback() {
          @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
            if (!signingInProgress.compareAndSet(true, false)) return;
            try {
              result.getCryptoObject().getSignature().update(challenge);
              JSObject response = new JSObject();
              response.put("signature", Base64.encodeToString(result.getCryptoObject().getSignature().sign(), Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING));
              call.resolve(response);
            } catch (Exception error) { call.reject("No se pudo firmar el desafío.", error); }
          }
          @Override public void onAuthenticationError(int code, CharSequence message) { rejectSigning(call, message.toString()); }
          @Override public void onAuthenticationFailed() { }
        });
    } catch (Exception error) {
      signingInProgress.set(false);
      call.reject("No se pudo iniciar la biometría.", error);
    }
  }

  private void rejectSigning(PluginCall call, String message) {
    if (signingInProgress.compareAndSet(true, false)) call.reject(message);
  }
}
