import logo from './branding/logo.png';
import lobbyBackground from './backgrounds/lobby.webp';
import goldPrizeIcon from './icons/14-gold-prize-trophy.png';
import silverPrizeIcon from './icons/15-silver-prize-trophy.png';
import bronzePrizeIcon from './icons/16-bronze-prize-trophy.png';
import scannerRover from './artwork/rover-06-scanner.png';
import deliveryRoverPrize from './prizes/prize-delivery-rover.png';
import shirtPrize from './prizes/prize-shirt.png';
import socksPrize from './prizes/prize-socks.png';

export const boostplayAssets = {
  branding: { logo },
  backgrounds: { lobby: lobbyBackground },
  icons: {
    goldPrize: goldPrizeIcon,
    silverPrize: silverPrizeIcon,
    bronzePrize: bronzePrizeIcon,
  },
  artwork: {
    scanner: scannerRover,
  },
  prizes: {
    deliveryRover: deliveryRoverPrize,
    shirt: shirtPrize,
    socks: socksPrize,
  },
} as const;
