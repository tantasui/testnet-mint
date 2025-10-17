import { useState, type ChangeEvent } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "./networkConfig";
import ClipLoader from "react-spinners/ClipLoader";

export function MintNFT() {
  const nftPackageId = useNetworkVariable("nftPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [mintedId, setMintedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const encoder = new TextEncoder();
  const toBytes = (str: string) => Array.from(encoder.encode(str));

  const mint = async () => {
    setError(null);
    setMintedId(null);

    if (!name || !description || !url) {
      setError("Please fill in all fields");
      return;
    }

    if (!nftPackageId || nftPackageId === "0xTODO") {
      setError("NFT package ID not configured for the current network.");
      return;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${nftPackageId}::testnet_nft::mint_to_sender`,
      arguments: [
        tx.pure.vector("u8", toBytes(name)),
        tx.pure.vector("u8", toBytes(description)),
        tx.pure.vector("u8", toBytes(url)),
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result: { digest: string }) => {
          const { digest } = result;
          const { effects } = await suiClient.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          const created = effects?.created?.[0]?.reference?.objectId ?? null;
          if (created) {
            setMintedId(created);
            window.location.hash = created;
          } else {
            setError("Mint succeeded, but could not find created object ID.");
          }
        },
        onError: (e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
        },
      },
    );
  };

  return (
    <Container>
      <Heading size="4">Mint Testnet NFT</Heading>
      <Flex direction="column" gap="3" mt="3" style={{ maxWidth: 520 }}>
        <input
          type="text"
          placeholder="Name"
          aria-label="Name"
          required
          autoComplete="off"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gray-a6)", background: "var(--gray-a1)" }}
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          aria-label="Description"
          required
          autoComplete="off"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gray-a6)", background: "var(--gray-a1)" }}
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
        />
        <input
          type="url"
          inputMode="url"
          placeholder="URL (e.g., ipfs://...)"
          aria-label="URL"
          required
          autoComplete="off"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gray-a6)", background: "var(--gray-a1)" }}
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
        />
        <Button variant="solid" color="green" onClick={mint} disabled={isPending || !nftPackageId || nftPackageId === "0xTODO"}>
          {isPending ? <ClipLoader size={20} /> : "Mint NFT"}
        </Button>
        {mintedId ? <Text>Minted NFT ID: {mintedId}</Text> : null}
        {error ? <Text color="red">Error: {error}</Text> : null}
        {!nftPackageId || nftPackageId === "0xTODO" ? (
          <Text color="orange">Set a valid NFT package ID in networkConfig.ts.</Text>
        ) : null}
      </Flex>
    </Container>
  );
}