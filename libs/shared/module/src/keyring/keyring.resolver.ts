import { Resolver, Query, Mutation, Args, ID, ResolveField, Subscription, Parent } from "@nestjs/graphql";
import { KeyringService } from "./keyring.service";
import { Inject, UseGuards } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";
import { Allow, Account, Auth, BaseResolver, Id, Signature } from "@shared/util-server";
import * as gql from "../gql";
import * as srv from "../srv";
import * as db from "../db";

@Resolver(() => gql.Keyring)
export class KeyringResolver extends BaseResolver(gql.Keyring, gql.KeyringInput, Allow.Admin, Allow.Admin, Allow.None) {
  constructor(
    private readonly keyringService: KeyringService,
    private readonly walletService: srv.WalletService,
    private readonly contractService: srv.ContractService
  ) {
    super(keyringService);
  }

  @Mutation(() => gql.AccessToken)
  async signinWithOtp(@Args({ name: "otp", type: () => String }) otp: string) {
    return await this.keyringService.signinWithOtp(otp);
  }

  @Mutation(() => gql.AccessToken)
  async signinWithAddress(
    @Args({ name: "networkId", type: () => ID }) networkId: string,
    @Signature() address: string
  ) {
    return await this.keyringService.signinWithAddress(new Id(networkId), address);
  }

  @Query(() => [gql.Keyring])
  async keyringHasWallet(@Args({ name: "networkId", type: () => ID }) networkId: string, @Signature() address: string) {
    return await this.keyringService.keyringsHasWallet(new Id(networkId), address);
  }

  @Mutation(() => gql.Keyring)
  async addWallet(
    @Args({ name: "keyringId", type: () => ID }) keyringId: string,
    @Args({ name: "networkId", type: () => ID }) networkId: string,
    @Signature() address: string
  ) {
    return await this.keyringService.addWallet(new Id(keyringId), new Id(networkId), address);
  }

  @Mutation(() => gql.Keyring)
  async removeWallet(
    @Args({ name: "keyringId", type: () => ID }) keyringId: string,
    @Args({ name: "walletId", type: () => ID }) walletId: string,
    @Args({ name: "address", type: () => ID }) address: string

    // @Signature() address: string
  ) {
    return await this.keyringService.removeWallet(new Id(keyringId), new Id(walletId), address);
  }

  @Mutation(() => gql.Otp)
  async generateOtp(@Auth() account: Account) {
    return await this.keyringService.generateOtp(new Id(account.keyring));
  }

  @ResolveField(() => [gql.Wallet])
  async wallets(@Parent() keyring: gql.Keyring) {
    return await this.walletService.loadMany(keyring.wallets);
  }

  @ResolveField(() => [gql.Contract])
  async holds(@Parent() keyring: gql.Keyring) {
    return await this.contractService.loadMany(keyring.holds);
  }
}
