import { ERC721A } from "@shared/contract";
import * as serverUtils from "../utils";
import { BigNumber, Contract, ethers, Event } from "ethers";
import { ContractSettings } from "./multicall";
import { Utils } from "@shared/util";

export type Erc721TrasferEventHandler = (from: string, to: string, tokenId: BigNumber, event: Event) => void;
export type Erc721ApprovalEventHandler = (owner: string, approved: string, tokenId: BigNumber, event: Event) => void;
export type Erc721ApprovalForAllEventHandler = (
  owner: string,
  operator: string,
  apporved: boolean,
  event: Event
) => void;
export type Erc721EventHandler = {
  onTransfer?: Erc721TrasferEventHandler;
  onApproval?: Erc721ApprovalEventHandler;
  onApprovalForAll?: Erc721ApprovalForAllEventHandler;
};
export type Erc721Info = {
  name: string;
  symbol: string;
  totalSupply: number;
  bn: number;
};
export class Erc721 {
  constructor(readonly address: string, readonly contract: ERC721A, readonly settings: ContractSettings) {}
  async info(): Promise<Erc721Info> {
    const [[name, bn], [symbol], [totalSupply]] = (
      await this.settings.multicall.view({
        calls: [
          { address: this.address, fn: "name", args: [] },
          { address: this.address, fn: "symbol", args: [] },
          { address: this.address, fn: "totalSupply", args: [] },
        ],
        settings: this.settings,
      })
    ).map((ret) => [ret[0], ret[1]]);
    return { name, symbol, totalSupply, bn };
  }
  async snapshot() {
    const tokenIds = await this.#tokenIdsAll();
    const tokenUris = await this.tokenURIs(tokenIds);
    const owners = await this.#ownersOf(tokenIds);
    return tokenUris.map((tokenUri, idx) => ({ ...tokenUri, ...owners[idx] }));
  }
  async inventory(owner: string, contracts: string[]) {
    const balanceMap = (
      await this.settings.multicall.view({
        calls: contracts.map((address) => ({ address, fn: "balanceOf", args: [owner] })),
        settings: this.settings,
      })
    ).map((ret, idx) => ({ address: owner, contract: contracts[idx], num: parseInt(ret[0].toString()), bn: ret[1] }));
    const calls = balanceMap.reduce(
      (acc, map) => [
        ...acc,
        ...new Array(map.num)
          .fill(0)
          .map((_, idx) => ({ address: map.contract, fn: "tokenOfOwnerByIndex", args: [owner, idx] })),
      ],
      []
    );
    const inventory = (await this.settings.multicall.view({ calls, settings: this.settings })).map((ret, idx) => ({
      address: owner,
      contract: calls[idx].address,
      tokenId: parseInt(ret[0].toString()),
      num: 1,
      bn: ret[0],
    }));
    const uris = await this.tokenURIs(inventory.map((inv) => inv.tokenId));
    return inventory.map((inv, idx) => ({ ...inv, uri: uris[idx].uri }));
  }
  async balances(owners: string[]) {
    const balances = (
      await this.settings.multicall.view({
        calls: owners.map((owner) => ({ address: this.address, fn: "balanceOf", args: [owner] })),
        settings: this.settings,
      })
    ).map((ret) => parseInt(ret[0].toString()));
    return balances;
  }
  async tokenURIs(tokenIds: number[]) {
    const uris: { tokenId: number; uri: string }[] = (
      await this.settings.multicall.view({
        calls: tokenIds.map((tokenId) => ({ address: this.address, fn: "tokenURI", args: [tokenId] })),
        settings: this.settings,
      })
    ).map((ret, idx) => ({ tokenId: tokenIds[idx], uri: ret[0] }));
    return uris;
  }
  async tokenIds(owner?: string) {
    return owner ? await this.#tokenIdsOfOwner(owner) : await this.#tokenIdsAll();
  }
  async checkApproval(owner: string, tokenId: number) {
    return (
      (await this.contract.isApprovedForAll(owner, this.settings.market.address)) &&
      (await this.#ownerOf(tokenId)).toLowerCase() === owner
    );
  }
  async transfer(from: string, to: string, tokenId: number) {
    await this.settings.market.transferErc721(this.address, from, to, tokenId, { gasLimit: 300000 });
    return true;
  }
  listen({ onTransfer, onApproval, onApprovalForAll }: Erc721EventHandler) {
    this.contract.removeAllListeners();
    onTransfer && this.contract.on("Transfer", onTransfer);
    onApproval && this.contract.on("Approval", onApproval);
    onApprovalForAll && this.contract.on("ApprovalForAll", onApprovalForAll);
  }
  destroy() {
    this.contract.removeAllListeners();
  }
  async #name() {
    return await this.contract.name();
  }
  async #symbol() {
    return await this.contract.symbol();
  }
  async #totalSupply() {
    return (await this.contract.totalSupply()).toNumber();
  }
  async #balanceOf(owner: string) {
    return (await this.contract.balanceOf(owner)).toNumber();
  }
  async #ownerOf(tokenId: number) {
    return await this.contract.ownerOf(tokenId);
  }
  async #ownersOf(tokenIds: number[]) {
    const owners: { address: string; num: number; bn: number }[] = (
      await this.settings.multicall.view({
        calls: tokenIds.map((tokenId) => ({ address: this.address, fn: "ownerOf", args: [tokenId] })),
        settings: this.settings,
      })
    ).map((ret) => ({ address: ret[0], bn: ret[1], num: 1 }));
    return owners;
  }
  async #tokenIdsOfOwner(owner: string): Promise<number[]> {
    const balance = await this.#balanceOf(owner);
    const tokenIds = (
      await this.settings.multicall.view({
        calls: new Array(balance)
          .fill(0)
          .map((_, idx) => ({ address: this.address, fn: "tokenOfOwnerByIndex", args: [owner, idx] })),
        settings: this.settings,
      })
    ).map((ret) => parseInt(ret[0].toString()));
    return tokenIds;
  }
  async #tokenIdsAll(): Promise<number[]> {
    const supply = await this.#totalSupply();
    const tokenIds = (
      await this.settings.multicall.view({
        calls: new Array(supply).fill(0).map((_, idx) => ({ address: this.address, fn: "tokenByIndex", args: [idx] })),
        settings: this.settings,
      })
    ).map((ret) => parseInt(ret[0].toString()));
    return tokenIds;
  }
}
