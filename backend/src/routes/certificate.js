import { Router } from "express";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { env, getMissingSolanaEnv } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function assertSolanaConfig() {
  const missing = getMissingSolanaEnv();

  if (missing.length > 0) {
    const error = new Error(
      `Solana configuration is incomplete: ${missing.join(", ")}`,
    );
    error.statusCode = 503;
    throw error;
  }
}

function parseCertificateKeypair() {
  try {
    const secretArray = JSON.parse(env.solanaCertificateSecret);
    return Keypair.fromSecretKey(Uint8Array.from(secretArray));
  } catch {
    const error = new Error(
      "SOLANA_CERTIFICATE_SECRET must be a JSON array of secret key bytes.",
    );
    error.statusCode = 500;
    throw error;
  }
}

router.post("/mint-certificate", requireAuth, async (req, res) => {
  try {
    assertSolanaConfig();

    const targetWallet =
      typeof req.body?.targetWallet === "string"
        ? req.body.targetWallet.trim()
        : "";

    if (!targetWallet) {
      return res.status(400).json({
        error: "targetWallet is required.",
      });
    }

    let recipientPubkey;

    try {
      recipientPubkey = new PublicKey(targetWallet);
    } catch {
      return res.status(400).json({
        error: "targetWallet is not a valid Solana public key.",
      });
    }

    const payer = parseCertificateKeypair();
    const connection = new Connection(env.solanaRpcUrl, "confirmed");

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: recipientPubkey,
        lamports: 100_000,
      }),
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
    );

    return res.status(200).json({
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 502;

    return res.status(statusCode).json({
      error: error.message ?? "Certificate minting failed.",
    });
  }
});

export default router;
