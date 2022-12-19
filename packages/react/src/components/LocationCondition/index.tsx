import {
  applyLocation,
  getFlowdata,
  getOptionValue,
  getSelectRange,
  locale,
} from "@fortune-sheet/core";
import _ from "lodash";
import React, { useContext, useState, useCallback, useRef } from "react";
import WorkbookContext from "../../context";
import { useDialog } from "../../hooks/useDialog";
import "./index.css";

export const LocationCondition: React.FC<{}> = () => {
  const { context, setContext } = useContext(WorkbookContext);
  const { showDialog, hideDialog } = useDialog();
  const { findAndReplace, button } = locale(context);
  const locationHTML = useRef<HTMLDivElement>(null);
  const [conditionType, setConditionType] = useState("locationConstant");
  const [constants, setConstants] = useState<Record<string, boolean>>({
    locationDate: true,
    locationDigital: true,
    locationString: true,
    locationBool: true,
    locationError: true,
  });
  const [formulas, setFormulas] = useState<Record<string, boolean>>({
    locationDate: true,
    locationDigital: true,
    locationString: true,
    locationBool: true,
    locationError: true,
  });
  // 确定按钮
  const certainBtn = useCallback(() => {
    hideDialog();
    if (conditionType === "locationConstant") {
      const value = getOptionValue(constants);
      const selectRange = getSelectRange(context);
      setContext((ctx) => {
        const rangeArr = applyLocation(selectRange, conditionType, value, ctx);
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationFormula") {
      const value = getOptionValue(formulas);
      const selectRange = getSelectRange(context);
      setContext((ctx) => {
        const rangeArr = applyLocation(selectRange, conditionType, value, ctx);
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationRowSpan") {
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].row[0] ===
            context.luckysheet_select_save[0].row[1])
      ) {
        showDialog(findAndReplace.locationTiplessTwoRow, "ok");
        return;
      }
      const selectRange = _.assignIn([], context.luckysheet_select_save);
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else if (conditionType === "locationColumnSpan") {
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].column[0] ===
            context.luckysheet_select_save[0].column[1])
      ) {
        showDialog(findAndReplace.locationTiplessTwoColumn, "ok");
        return;
      }
      const selectRange = _.assignIn([], context.luckysheet_select_save);
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    } else {
      let selectRange: {
        row: (number | undefined)[];
        column: any[];
      }[];
      if (
        context.luckysheet_select_save?.length === 0 ||
        (context.luckysheet_select_save?.length === 1 &&
          context.luckysheet_select_save[0].row[0] ===
            context.luckysheet_select_save[0].row[1] &&
          context.luckysheet_select_save[0].column[0] ===
            context.luckysheet_select_save[0].column[1])
      ) {
        const flowdata = getFlowdata(context, context.currentSheetId);
        selectRange = [
          {
            row: [0, flowdata!.length - 1],
            column: [0, flowdata![0].length - 1],
          },
        ];
      } else {
        selectRange = _.assignIn([], context.luckysheet_select_save);
      }
      setContext((ctx) => {
        const rangeArr = applyLocation(
          selectRange,
          conditionType,
          undefined,
          ctx
        );
        if (rangeArr.length === 0)
          showDialog(findAndReplace.locationTipNotFindCell, "ok");
      });
    }
  }, [
    conditionType,
    constants,
    context,
    findAndReplace.locationTipNotFindCell,
    findAndReplace.locationTiplessTwoColumn,
    findAndReplace.locationTiplessTwoRow,
    formulas,
    hideDialog,
    setContext,
    showDialog,
  ]);

  // 选中事件处理
  const isSelect = useCallback(
    (currentType) => conditionType === currentType,
    [conditionType]
  );

  return (
    <div id="fortunesheet-location-condition">
      <div className="title">{findAndReplace.location}</div>
      <div className="listbox">
        {/* 常量 */}
        <div className="listItem" ref={locationHTML}>
          <input
            type="radio"
            name="locationType"
            id="locationConstant"
            defaultChecked={isSelect("locationConstant")}
            onClick={() => {
              setConditionType("locationConstant");
            }}
          />
          <label htmlFor="locationConstant">
            {findAndReplace.locationConstant}
          </label>
          <div className="subbox">
            <div className="subItem">
              <input
                type="checkbox"
                className="date"
                id="locationConstantDate"
                disabled={!isSelect("locationConstant")}
                checked={constants.locationDate}
                onChange={() => {
                  setConstants((v) => {
                    return {
                      ...v,
                      locationDate: !v.locationDate,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationConstantDate"
                style={{
                  color: isSelect("locationConstant") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationDate}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="number"
                id="locationConstantNumber"
                disabled={!isSelect("locationConstant")}
                checked={constants.locationDigital}
                onChange={() => {
                  setConstants((v) => {
                    return {
                      ...v,
                      locationDigital: !v.locationDigital,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationConstantNumber"
                style={{
                  color: isSelect("locationConstant") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationDigital}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="string"
                id="locationConstantString"
                disabled={!isSelect("locationConstant")}
                checked={constants.locationString}
                onChange={() => {
                  setConstants((v) => {
                    return {
                      ...v,
                      locationString: !v.locationString,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationConstantString"
                style={{
                  color: isSelect("locationConstant") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationString}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="boolean"
                id="locationConstantBoolean"
                disabled={!isSelect("locationConstant")}
                checked={constants.locationBool}
                onChange={() => {
                  setConstants((v) => {
                    return {
                      ...v,
                      locationBool: !v.locationBool,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationConstantBoolean"
                style={{
                  color: isSelect("locationConstant") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationBool}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="error"
                id="locationConstantError"
                disabled={!isSelect("locationConstant")}
                checked={constants.locationError}
                onChange={() => {
                  setConstants((v) => {
                    return {
                      ...v,
                      locationError: !v.locationError,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationConstantError"
                style={{
                  color: isSelect("locationConstant") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationError}
              </label>
            </div>
          </div>
        </div>
        {/* 公式 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationFormula"
            onClick={() => {
              setConditionType("locationFormula");
            }}
          />
          <label htmlFor="locationFormula">
            {findAndReplace.locationFormula}
          </label>
          <div className="subbox">
            <div className="subItem">
              <input
                type="checkbox"
                className="date"
                id="locationFormulaDate"
                disabled={!isSelect("locationFormula")}
                checked={formulas.locationDate}
                onChange={() => {
                  setFormulas((v) => {
                    return {
                      ...v,
                      locationDate: !v.locationDate,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationFormulaDate"
                style={{
                  color: isSelect("locationFormula") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationDate}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="number"
                id="locationFormulaNumber"
                disabled={!isSelect("locationFormula")}
                checked={formulas.locationDigital}
                onChange={() => {
                  setFormulas((v) => {
                    return {
                      ...v,
                      locationDigital: !v.locationDigital,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationFormulaNumber"
                style={{
                  color: isSelect("locationFormula") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationDigital}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="string"
                id="locationFormulaString"
                disabled={!isSelect("locationFormula")}
                checked={formulas.locationString}
                onChange={() => {
                  setFormulas((v) => {
                    return {
                      ...v,
                      locationString: !v.locationString,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationFormulaString"
                style={{
                  color: isSelect("locationFormula") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationString}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="boolean"
                id="locationFormulaBoolean"
                disabled={!isSelect("locationFormula")}
                checked={formulas.locationBool}
                onChange={() => {
                  setFormulas((v) => {
                    return {
                      ...v,
                      locationBool: !v.locationBool,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationFormulaBoolean"
                style={{
                  color: isSelect("locationFormula") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationBool}
              </label>
            </div>
            <div className="subItem">
              <input
                type="checkbox"
                className="error"
                id="locationFormulaError"
                disabled={!isSelect("locationFormula")}
                checked={formulas.locationError}
                onChange={() => {
                  setFormulas((v) => {
                    return {
                      ...v,
                      locationError: !v.locationError,
                    };
                  });
                }}
              />
              <label
                htmlFor="locationFormulaError"
                style={{
                  color: isSelect("locationFormula") ? "#000" : "#666",
                }}
              >
                {findAndReplace.locationError}
              </label>
            </div>
          </div>
        </div>
        {/* 空值 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationNull"
            onClick={() => {
              setConditionType("locationNull");
            }}
          />
          <label htmlFor="locationNull">{findAndReplace.locationNull}</label>
        </div>
        {/* 条件格式 */}
        {/* <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationCF"
            onClick={() => {
              setConditionType("locationCF");
            }}
          />
          <label htmlFor="locationCF">{findAndReplace.locationCondition}</label>
        </div> */}
        {/* 间隔行 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationStepRow"
            onClick={() => {
              setConditionType("locationRowSpan");
            }}
          />
          <label htmlFor="locationStepRow">
            {findAndReplace.locationRowSpan}
          </label>
        </div>
        {/* 间隔列 */}
        <div className="listItem">
          <input
            type="radio"
            name="locationType"
            id="locationStepColumn"
            onClick={() => {
              setConditionType("locationColumnSpan");
            }}
          />
          <label htmlFor="locationStepColumn">
            {findAndReplace.locationColumnSpan}
          </label>
        </div>
      </div>

      <div
        className="button-basic button-primary"
        onClick={() => {
          certainBtn();
        }}
      >
        {button.confirm}
      </div>
      <div
        className="button-basic button-close"
        onClick={() => {
          hideDialog();
        }}
      >
        {button.cancel}
      </div>
    </div>
  );
};
