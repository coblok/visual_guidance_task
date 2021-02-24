export function shrinkGrid(grid) {
    // find out how big part of the grid is being used
  
    var start_row = -1;
    var end_row = -1;
    var start_column = 99;
    var end_column = 0;
    for(var i=0; i<grid.length; i++) {
      var some = false;
      for(var j=0; j<grid[i].length; j++) some = some | grid[i][j];
      if(some) {
        if(start_row == -1) start_row = i;
        end_row = i;
      }
      for(var j=1; j<grid[i].length; j++) {
        if(grid[i][j]) {
          if(j < start_column) start_column = j;
          if(j > end_column) end_column = j;      
        }
      }
    }
  
    //make the resulting area into square shape
    var height = end_row - start_row + 1;
    var width = end_column - start_column + 1;
  
    while(height < width ) {
      end_row = Math.min(end_row + 1, grid.length);
      height = end_row - start_row + 1;
      if(height < width) start_row = Math.max(start_row - 1, 0);
      height = end_row - start_row + 1;
    }
    while(width < height) {
      end_column = Math.min(end_column + 1, grid[0].length);
      width = end_column - start_column + 1;
      if(width < height) start_column = Math.max(start_column - 1, 0);
      width = end_column - start_column + 1;
    }
    
    var shrinked = [];
    for(var i=start_row; i<=end_row; i++) {
      var row = grid[i].slice(start_column, end_column + 1);
      row.unshift(false);
      shrinked.push(row);
    }
  
    return shrinked;
  }