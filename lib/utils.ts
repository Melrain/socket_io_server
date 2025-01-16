import { IPlayer } from "../database/player.model.js";
export const reorderPlayers = ({
  players,
  walletAddress,
}: {
  players: IPlayer[];
  walletAddress: string;
}) => {
  // 查找特定玩家的索引
  const index = players.findIndex(
    (player) => player.walletAddress === walletAddress
  );
  // 如果找不到玩家，直接返回原列表
  if (index === -1) {
    return players;
  }
  // 从数组中移除该玩家并保存
  const [removedPlayer] = players.splice(index, 1);
  // 将移除的玩家放在最前面，并返回新数组
  const reOrderedPlayers = [removedPlayer, ...players];
  return reOrderedPlayers;
};
