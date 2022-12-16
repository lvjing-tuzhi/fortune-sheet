import _ from "lodash";
import { Context, getFlowdata } from "../context";
import { normalizeSelection } from "./selection";

export function deleteCellInSave(
  cellSave: Record<string, number>,
  range: { row: any[]; column: any[] }
): Record<string, number> {
  for (let r = range.row[0]; r <= range.row[1]; r += 1) {
    for (let c = range.column[0]; c <= range.column[1]; c += 1) {
      delete cellSave[`${r}_${c}`];
    }
  }
  return cellSave;
}
// 得到符合条件的cell坐标
export function getRangeArr(
  minR: number,
  maxR: number,
  minC: number,
  maxC: number,
  cellSave: Record<string, number>,
  rangeArr: { row: (number | null)[]; column: (number | null)[] }[],
  ctx: Context
): any {
  if (_.keys(cellSave).length === 0) {
    return rangeArr;
  }
  let stack_str = null;
  let stack_edr = null;
  let stack_stc = null;
  let stack_edc = null;
  const flowData = getFlowdata(ctx, ctx.currentSheetId);
  for (let r = minR; r <= maxR; r += 1) {
    for (let c = minC; c <= maxC; c += 1) {
      if (_.isUndefined(flowData) || _.isNull(flowData)) break;
      const cell = flowData[r][c];
      if (`${r}_${c}` in cellSave) {
        if (
          cell !== null &&
          cell.mc !== null &&
          !_.isUndefined(cell) &&
          !_.isUndefined(cell.mc) &&
          !_.isUndefined(cell.mc.r) &&
          !_.isUndefined(cell.mc.rs) &&
          !_.isUndefined(cell.mc.cs)
        ) {
          if (stack_stc === null) {
            const range = {
              row: [cell.mc.r, cell.mc.r + cell.mc.rs - 1],
              column: [cell.mc.c, cell.mc.c + cell.mc.cs - 1],
            };
            rangeArr.push(range);
            cellSave = deleteCellInSave(cellSave, range);
            return getRangeArr(minR, maxR, minC, maxC, cellSave, rangeArr, ctx);
          }
          if (!_.isNull(stack_edc) && c < stack_edc) {
            const range = {
              row: [stack_str, stack_edr],
              column: [stack_stc, stack_edc],
            };
            rangeArr.push(range);
            cellSave = deleteCellInSave(cellSave, range);
            return getRangeArr(minR, maxR, minC, maxC, cellSave, rangeArr, ctx);
          }
          break;
        } else if (stack_stc === null) {
          stack_stc = c;
          stack_edc = c;

          stack_str = r;
          stack_edr = r;
        } else if (!_.isNull(stack_edc) && c > stack_edc) {
          stack_edc = c;
        }
      } else if (stack_stc !== null) {
        if (cell !== null && cell.mc !== null) {
          break;
        } else if (c < stack_stc) {
        } else if (!_.isNull(stack_edc) && c <= stack_edc) {
          const range = {
            row: [stack_str, stack_edr],
            column: [stack_stc, stack_edc],
          };
          rangeArr.push(range);
          cellSave = deleteCellInSave(cellSave, range);
          return getRangeArr(minR, maxR, minC, maxC, cellSave, rangeArr, ctx);
        } else {
          stack_edr = r;
        }
      }
    }
  }
  if (stack_stc !== null) {
    const range = {
      row: [stack_str, stack_edr],
      column: [stack_stc, stack_edc],
    };
    rangeArr.push(range);
    cellSave = deleteCellInSave(cellSave, range);
    return getRangeArr(minR, maxR, minC, maxC, cellSave, rangeArr, ctx);
  }
  return rangeArr;
}

// 获取操作列表
export function getOptionValue(
  constants: Record<string, boolean>
): string | undefined {
  const tempConstans = _.cloneDeep(constants);
  const len = _.filter(tempConstans, (o) => o).length;
  let value;
  if (len === 0) return "";
  if (len === 5) {
    value = "all";
  } else {
    const arr: string[] = [];
    _.toPairs(constants).forEach((entry) => {
      const [k, v] = entry;
      if (v) {
        if (k === "locationDate") {
          arr.push("d");
        } else if (k === "locationDigital") {
          arr.push("n");
        } else if (k === "locationString") {
          arr.push("s,g");
        } else if (k === "locationBool") {
          arr.push("b");
        } else if (k === "locationError") {
          arr.push("e");
        }
      }
    });
    value = arr.join(",");
  }
  return value;
}
// 获取选区坐标
export function getSelectRange(ctx: Context) {
  // 判断选区是不是单个单元格，如果是的话则选区范围改为整张表
  let range;
  if (
    ctx.luckysheet_select_save?.length === 0 ||
    (ctx.luckysheet_select_save?.length === 1 &&
      ctx.luckysheet_select_save[0].row[0] ===
        ctx.luckysheet_select_save[0].row[1] &&
      ctx.luckysheet_select_save[0].column[0] ===
        ctx.luckysheet_select_save[0].column[1])
  ) {
    const flowdata = getFlowdata(ctx, ctx.currentSheetId);
    if (_.isUndefined(flowdata) || _.isNull(flowdata)) return [];
    range = [
      { row: [0, flowdata.length - 1], column: [0, flowdata[0].length - 1] },
    ];
  } else {
    range = _.assignIn([], ctx.luckysheet_select_save);
  }
  return range;
}
// 条件定位功能
export function applyLocation(
  range: { row: any[]; column: any[] }[],
  type: string,
  value: string | undefined,
  ctx: Context
) {
  let rangeArr: { column: any[]; row: any[] }[] = [];
  if (
    type === "locationFormula" ||
    type === "locationConstant" ||
    type === "locationNull"
  ) {
    // 公式 常量 空值
    let minR = null;
    let maxR = null;
    let minC = null;
    let maxC = null;
    const cellSave: Record<string, number> = {};
    const flowData = getFlowdata(ctx, ctx.currentSheetId);
    if (_.isUndefined(flowData) || _.isNull(flowData)) return [];
    for (let s = 0; s < range.length; s += 1) {
      const st_r = range[s].row[0];
      const ed_r = range[s].row[1];
      const st_c = range[s].column[0];
      const ed_c = range[s].column[1];
      if (minR === null || minR < st_r) {
        minR = st_r;
      }
      if (maxR === null || maxR > ed_r) {
        maxR = ed_r;
      }
      if (minC === null || minC < st_c) {
        minC = st_c;
      }
      if (maxC == null || maxC > ed_c) {
        maxC = ed_c;
      }
      for (let r = st_r; r <= ed_r; r += 1) {
        for (let c = st_c; c <= ed_c; c += 1) {
          let cell = flowData[r][c];
          if (cell != null && cell.mc != null) {
            cell = flowData[cell.mc.r][cell.mc.c];
          }
          if (
            type === "locationFormula" &&
            cell != null &&
            !_.isNull(cell.v) &&
            cell.f != null &&
            (value === "all" ||
              (cell.ct != null &&
                !_.isUndefined(value) &&
                !_.isUndefined(cell.ct.t) &&
                value.indexOf(cell.ct.t) > -1))
          ) {
            cellSave[`${r}_${c}`] = 0;
          } else if (
            type === "locationConstant" &&
            cell !== null &&
            !_.isNull(cell.v) &&
            (value === "all" ||
              (cell.ct !== null &&
                !_.isUndefined(cell.ct) &&
                !_.isUndefined(cell.ct.t) &&
                value!.indexOf(cell.ct.t) > -1))
          ) {
            cellSave[`${r}_${c}`] = 0;
          } else if (
            type === "locationNull" &&
            (cell === null || _.isNull(cell.v))
          ) {
            cellSave[`${r}_${c}`] = 0;
          }
        }
      }
    }
    rangeArr = getRangeArr(minR, maxR, minC, maxC, cellSave, rangeArr, ctx);
  } else if (type === "locationCF") {
    console.log("进入条件格式");
    // TODO定位条件
    // 条件格式
    // const index = getSheetIndex(ctx, ctx.currentSheetId) as number;
    // let ruleArr = ctx.luckysheetfile[index].luckysheet_conditionformat_save;
    // let {data} = ctx.luckysheetfile[index];
    // if (ruleArr === null || ruleArr?.length === 0) {
    //   return [];
    // }
  } else if (type === "locationRowSpan") {
    for (let s = 0; s < range.length; s += 1) {
      if (range[s].row[0] === range[s].row[1]) {
        continue;
      }
      const st_r = range[s].row[0];
      const ed_r = range[s].row[1];
      const st_c = range[s].column[0];
      const ed_c = range[s].column[1];
      for (let r = st_r; r <= ed_r; r += 1) {
        if ((r - st_r) % 2 === 0) {
          rangeArr.push({ row: [r, r], column: [st_c, ed_c] });
        }
      }
    }
  } else if (type === "locationColumnSpan") {
    // 间隔列
    for (let s = 0; s < range.length; s += 1) {
      if (range[s].column[0] === range[s].column[1]) {
        continue;
      }

      const st_r = range[s].row[0];
      const ed_r = range[s].row[1];
      const st_c = range[s].column[0];
      const ed_c = range[s].column[1];

      for (let c = st_c; c <= ed_c; c += 1) {
        if ((c - st_c) % 2 === 0) {
          rangeArr.push({ row: [st_r, ed_r], column: [c, c] });
        }
      }
    }
  }
  if (rangeArr.length === 0) {
    // if(isEditMode()){
    //     alert(locale_location.locationTipNotFindCell);
    // }
    // else{
    //     tooltip.info("", locale_location.locationTipNotFindCell);
    // }
    return rangeArr;
  }
  ctx.luckysheet_select_save = normalizeSelection(ctx, rangeArr);
  return rangeArr;
}
