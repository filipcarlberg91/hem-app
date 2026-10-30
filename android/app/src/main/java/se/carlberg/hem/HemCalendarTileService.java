package se.carlberg.hem;

import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.ResourceBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.ListenableFuture;

public class HemCalendarTileService extends TileService {
    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        return HemTileHelper.buildTile(this, requestParams, "calendar");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        return HemTileHelper.buildResources();
    }
}
