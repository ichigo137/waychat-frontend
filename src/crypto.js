// crypto.js
// wraps libsodium-wrappers for keypair generation, deriving shared key, and AEAD encrypt/decrypt.

import sodium from 'libsodium-wrappers';
import localforage from 'localforage';

const PRIVATE_KEY_STORAGE = 'waychat_private_key'; // stored raw binary (Uint8Array) via localForage
const PUBLIC_KEY_STORAGE = 'waychat_public_key';

async function ready() {
  if (!sodium.ready) await sodium.ready;
  return sodium;
}

export async function generateAndStoreKeypair() {
  await ready();
  const keyPair = sodium.crypto_kx_keypair(); // X25519 keys
  // Convert to base64 for storage and for sending to server
  const pubB64 = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);
  const privB64 = sodium.to_base64(keyPair.privateKey, sodium.base64_variants.ORIGINAL);
  await localforage.setItem(PUBLIC_KEY_STORAGE, pubB64);
  await localforage.setItem(PRIVATE_KEY_STORAGE, privB64);
  return { publicKey: pubB64, privateKey: privB64 };
}

export async function getStoredKeypair() {
  await ready();
  const pub = await localforage.getItem(PUBLIC_KEY_STORAGE);
  const priv = await localforage.getItem(PRIVATE_KEY_STORAGE);
  if (!pub || !priv) return null;
  return { publicKey: pub, privateKey: priv };
}

// derive symmetric key via X25519 scalar mult and hash
// inputs: privateKeyBase64, recipientPublicBase64
function deriveSymmetricKey(privateKeyB64, recipientPublicB64) {
  const priv = sodium.from_base64(privateKeyB64, sodium.base64_variants.ORIGINAL);
  const pub = sodium.from_base64(recipientPublicB64, sodium.base64_variants.ORIGINAL);
  const shared = sodium.crypto_scalarmult(priv, pub); // raw shared secret
  // derive 32-byte key via generichash
  const key = sodium.crypto_generichash(32, shared);
  return key;
}

export async function encryptFor(recipientPubB64, plaintext, senderPrivB64) {
  await ready();
  const key = deriveSymmetricKey(senderPrivB64, recipientPubB64);
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    sodium.from_string(plaintext),
    null,
    null,
    nonce,
    key
  );
  return {
    ciphertext: sodium.to_base64(ciphertext, sodium.base64_variants.ORIGINAL),
    nonce: sodium.to_base64(nonce, sodium.base64_variants.ORIGINAL)
  };
}

export async function decryptFrom(senderPubB64, ciphertextB64, nonceB64, recipientPrivB64) {
  await ready();
  const key = deriveSymmetricKey(recipientPrivB64, senderPubB64);
  const ct = sodium.from_base64(ciphertextB64, sodium.base64_variants.ORIGINAL);
  const nonce = sodium.from_base64(nonceB64, sodium.base64_variants.ORIGINAL);
  try {
    const plainBuf = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ct,
      null,
      nonce,
      key
    );
    return sodium.to_string(plainBuf);
  } catch (e) {
    console.error('decrypt failed', e);
    return null;
  }
}