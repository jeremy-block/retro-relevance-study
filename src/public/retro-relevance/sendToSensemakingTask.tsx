import { useCallback, useMemo } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from "../../store/types";
import { Button } from "@mantine/core";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function testTwo({ setAnswer }: StimulusParams<any>){
  
const answers = useStoreSelector((state) => state.answers);
  console.log("🚀 ~ test ~ answers:", answers)


  const { actions, trrack } = useMemo(() => {
      const reg = Registry.create();
  
      const clickAction = reg.register('click', (state, click:boolean) => {
        state.clicked = click;
        return state;
      });
  
      const trrackInst = initializeTrrack({
        registry: reg,
        initialState: {
          clicked: false,
        },
      });
  
      return {
        actions: {
          clickAction,
        },
        trrack: trrackInst,
      };
  }, []);
  
    const clickCallback = useCallback(() => {
        
      window.open("https://indie.cise.ufl.edu/MaverickMystery/?=5", "_blank");
  
      trrack.apply('Clicked', actions.clickAction(true));
  
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {
          "clicked": true,
        },
      });
    }, [actions, setAnswer, trrack]);
  return (
    <div>
      <h1>Pause</h1>
      <p>Please pause here and inform the researcher you are ready to begin. <br/>Please make sure you:</p>
      <ul>
        <li>open the document explorer in an <strong>incognito window</strong></li>
        <li>understood the <strong>interface tools</strong>.</li>
      </ul>
      <Button
        variant="outline"
        color="green"
        onClick={() => {
          clickCallback(); //use a click callback to trigger the setAnswer function and allow the user to continue after opening the document explorer.
        }}
      >
        Open Document Explorer
      </Button>
    </div>
  );
}

export default testTwo;
