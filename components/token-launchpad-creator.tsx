"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createMint } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

export function TokenLaunchpadCreator() {
  const [imageUploading, setImageUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const wallet = useWallet();
  if (!wallet) {
    return <div>Wallet not connected</div>;
  }
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    description: "",
    supply: "",
    image: "/placeholder.svg?height=200&width=200",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTokenData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // const reader = new FileReader()
      // reader.onloadend = () => {
      //   setTokenData(prev => ({ ...prev, image: reader.result as string }))
      // }
      // reader.readAsDataURL(file)
      try {
        if (!file) {
          alert("No file selected");
          return;
        }

        setImageUploading(true);
        const data = new FormData();
        data.set("file", file);
        const uploadRequest = await fetch("/api/files", {
          method: "POST",
          body: data,
        });
        const ipfsUrl = await uploadRequest.json();
        console.log(ipfsUrl);
        setUrl(ipfsUrl);
        setImageUploading(false);
      } catch (e) {
        console.log(e);
        setImageUploading(false);
        alert("Trouble uploading file");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the token data to your backend or blockchain
    console.log("Token data submitted:", tokenData);
    // In a real application, you'd handle token creation here
    alert("Token creation initiated! (This is a placeholder action)");
  };

  const createToken = async () => {
    const { name, symbol, description, image } = tokenData;

   try {
    setUploading(true);
    if (!name || !symbol || !description || !url) {
      alert(
        "Please fill all fields and upload an image before submitting metadata."
      );
      return;
    }
    const mintKeypair = web3.Keypair.generate();
    let MetdataUrl;
    const metadataJSON = {
      name,
      symbol,
      description,
      image: url,
    };

    try {
      
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([JSON.stringify(metadataJSON)], { type: "application/json" }),
        "metadata.json"
      );

      const metadataRequest = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      const metadataIpfsUrl = await metadataRequest.json();
      MetdataUrl = metadataIpfsUrl;
      
      
    } catch (e) {
      console.log(e);
     
      alert("Trouble uploading metadata");
    }

    if (!wallet.connected || !publicKey) {
      console.error("Wallet not connected.");
      return;
    }
    if (!MetdataUrl) {
      alert("Metadata not uploaded");
      return;
    }

    const metadata = {
      mint: mintKeypair.publicKey,
      name: name,
      symbol: symbol,
      uri: MetdataUrl,
      additionalMetadata: [],
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    if (!wallet.publicKey) {
      alert("Wallet not connected");
      return;
    }

    const transaction = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mintKeypair.publicKey,
        metadata: mintKeypair.publicKey,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      })
    );
    transaction.feePayer = publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.partialSign(mintKeypair);
    await wallet.sendTransaction(transaction, connection);
    alert(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);

    const associatedToken = token.getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const transaction2 = new web3.Transaction().add(
      token.createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedToken,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID
      )
    );

    await wallet.sendTransaction(transaction2, connection);

    const transaction3 = new web3.Transaction().add(
      token.createMintToInstruction(
        mintKeypair.publicKey,
        associatedToken,
        wallet.publicKey,
        1000000000,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    await wallet.sendTransaction(transaction3, connection);

    setTokenData({
      name: "",
      symbol: "",
      description: "",
      supply: "",
      image: "/placeholder.svg?height=200&width=200",
    });
    const tokenAdress = mintKeypair.publicKey.toBase58();
    alert(`Token created successfully ${tokenAdress}`, );
   } catch (error) {
    setUploading(false);
    console.error(error);
    alert("Error creating token",);
   } finally{
    setUploading(false);
   }


  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Create Your Solana Token
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Token Name</Label>
            <Input
              id="name"
              name="name"
              value={tokenData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Token Symbol</Label>
            <Input
              id="symbol"
              name="symbol"
              value={tokenData.symbol}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={tokenData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supply">Total Supply</Label>
            <Input
              id="supply"
              name="supply"
              type="number"
              value={tokenData.supply}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Token Image</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" onClick={createToken} disabled={uploading}>
              {uploading || imageUploading ? "Creating Token... or uploading image" : "Create Token"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
