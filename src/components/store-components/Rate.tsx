import React from "react";
import { Star } from "@phosphor-icons/react/dist/ssr";

interface RateProps {
  currentRate: number | undefined;
  size: number;
}

const Rate: React.FC<RateProps> = ({ currentRate, size }) => {
  const arrOfStar = [];
  for (let i = 0; i < 5; i++) {
    if (currentRate) {
      if (i >= currentRate) {
        arrOfStar.push(
          <Star key={i} size={size} color="#9FA09C" weight="fill" />,
        );
      } else {
        arrOfStar.push(
          <Star key={i} size={size} color="#ECB018" weight="fill" />,
        );
      }
    }
  }
  return <div className="flex">{arrOfStar}</div>;
};

export default Rate;
