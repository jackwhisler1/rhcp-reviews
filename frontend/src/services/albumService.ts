import { fetchWrapper } from "./api";
import { SongStat } from "../types/rhcp-types";

export const getAlbumStats = async (
  albumId: number,
  params: Record<string, string | undefined>
): Promise<SongStat[]> => {
  const validParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  );

  const query = new URLSearchParams(validParams as Record<string, string>);
  return fetchWrapper(`/albums/${albumId}/songs/stats?${query}`);
};
