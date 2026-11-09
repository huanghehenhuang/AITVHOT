import film from "../../assets/monochrome/film.svg?no-inline";
import search from "../../assets/monochrome/search.svg?no-inline";
import sun from "../../assets/monochrome/sun.svg?no-inline";
import moon from "../../assets/monochrome/moon.svg?no-inline";
import arrow from "../../assets/monochrome/arrow.svg?no-inline";
import arrowInverse from "../../assets/monochrome/arrow-inverse.svg?no-inline";
import bookmark from "../../assets/monochrome/bookmark.svg?no-inline";
import storyboard from "../../assets/monochrome/storyboard.svg?no-inline";
import menu from "../../assets/monochrome/menu.svg?no-inline";
import grid from "../../assets/monochrome/grid.svg?no-inline";

const ASSETS = { film, search, sun, moon, arrow, arrowInverse, bookmark, storyboard, menu, grid };
export type DesignAssetName = keyof typeof ASSETS;

/** Original Figma vectors retain their intrinsic dimensions inside their design slots. */
export function DesignAsset({ name, className = "" }: { name: DesignAssetName; className?: string }) {
  const darkInk = name === "menu" || name === "grid";
  return <span aria-hidden="true" className={`design-asset ${darkInk ? "design-asset-black" : "design-asset-white"} ${name === "storyboard" ? "design-storyboard" : ""} ${className}`}><img src={ASSETS[name]} alt="" draggable={false} /></span>;
}
