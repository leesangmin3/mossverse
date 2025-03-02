import { types, userStore, mapStore, inventoryStore, worldStore, characterStore } from "../../stores";
import styled, { keyframes } from "styled-components";
import { GuestButton, LoginModal } from "./../";
import { keyringStore, networkStore, useKeyring } from "@shared/data-access";
import { MetaLoginButton, LoginSelector, LoginSelectorMobile } from "@shared/ui-web";
import { useEffect } from "react";
import { cnst } from "@shared/util";
import { toast } from "react-toastify";
import { MediaSettingModal } from "../interface/MediaSettingModal";

export interface LoginProps {
  logo?: string;
  backgroundImage?: string;
  style?: any;
  networkType: cnst.NetworkType;
}

export const Login = ({ style, logo, backgroundImage, networkType }: LoginProps) => {
  const whoAmI = userStore.use.whoAmI();
  const guest = userStore.use.guest();
  const login = keyringStore.use.login();
  const loginMethod = keyringStore.use.loginMethod();
  const network = networkStore.use.network();
  const signWalletConnect = keyringStore.use.signWalletConnect();
  const changeLoginMethod = (loginMethod: types.shared.LoginMethod) => useKeyring.setState({ loginMethod });
  const initNetwork = networkStore.use.init();
  const isShowVideoAudioSetting = userStore.use.isShowVideoAudioSetting();

  useEffect(() => {
    initNetwork(networkType);
  }, []);

  const onClickButtonToMobile = async (loginMethod: types.shared.LoginMethod) => {
    // try {
    if (!network) return;

    await signWalletConnect(loginMethod);
    await whoAmI();
    changeLoginMethod(loginMethod);
    keyringStore.setState({ signStatus: "none", isOpenModal: false });
  };

  const onClickButton = async (loginMethod: types.shared.LoginMethod) => {
    // try {
    await login(loginMethod);
    await whoAmI();
    changeLoginMethod(loginMethod);
    keyringStore.setState({ isOpenModal: false });
    // } catch (err) {
    //   err instanceof Error &&
    //     err.message.includes("User denied message signature.") &&
    //     toast.error("User denied message signature.");
    //   return;
    // }
  };

  const onClickGuest = async () => {
    guest();
    changeLoginMethod("guest");
  };

  return (
    <Container backgroundImage={backgroundImage ?? undefined}>
      <img alt="logo" src={logo ?? undefined} className="logo" />
      <div className="main-buttons">
        {loginMethod === "none" && (
          <>
            <MetaLoginButton title={"Connect"} />
            <GuestButton onClick={onClickGuest} />
          </>
        )}
      </div>

      <div className="only-mobile">
        <LoginSelectorMobile
          ethereum={async () => await onClickButtonToMobile("ethereum")}
          klaytn={async () => await onClickButtonToMobile("klaytn")}
        />
      </div>
      <div className="only-pc">
        <LoginSelector
          ethereum={async () => await onClickButton("ethereum")}
          klaytn={async () => await onClickButton("klaytn")}
        />
      </div>
      <LoginModal />
      {isShowVideoAudioSetting && <MediaSettingModal isShowVideoAudioSetting={isShowVideoAudioSetting} />}
    </Container>
  );
};

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const Container = styled("div")<{ backgroundImage?: string }>`
  background-image: url(${(props) => props.backgroundImage ?? "null"});
  background-size: cover;
  background-position: center;
  position: relative;
  width: 100%;
  height: 100vh;
  font-size: 50px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: #483533;
  @media screen and (max-width: 800px) {
    overflow: hidden;
    overflow-x: hidden;
    overflow-y: hidden;
    -webkit-overflow-scrolling: none;
    /* 이외의 브라우저 */
    overscroll-behavior: none;
  }
  .logo {
    -webkit-filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.7));
    margin-bottom: 30px;
    opacity: 0;
    animation: ${fadeIn} 1s ease-in-out forwards;
    width: 990px;
    @media screen and (max-width: 990px) {
      width: 90%;
      /* margin-bottom: 60px; */
      margin-top: 120px;
    }
  }

  .main-buttons {
    opacity: 0;
    margin-top: 50px;
    min-height: 200px;
    animation: ${fadeIn} 0.5s ease-in-out 0.5s forwards;
    @media screen and (max-width: 800px) {
      margin-top: 50px;
    }
  }
`;
