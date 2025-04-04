import { useCallback, useMemo } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from "../../store/types";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function testTwo({ setAnswer }: StimulusParams<any>){
  
const answers = useStoreSelector((state) => state.answers);
  console.log("🚀 ~ test ~ answers:", answers)


  const { actions, trrack } = useMemo(() => {
      const reg = Registry.create();
  
      const clickAction = reg.register('click', (state, click: { distance: number}) => {
        state.distance = click.distance;
        return state;
      });
  
      const trrackInst = initializeTrrack({
        registry: reg,
        initialState: {
          distance: 0
        },
      });
  
      return {
        actions: {
          clickAction,
        },
        trrack: trrackInst,
      };
  }, []);
  
    const clickCallback = useCallback((e: React.MouseEvent) => {
  
      const newDistance = Math.random();
  
      trrack.apply('Clicked', actions.clickAction({ distance: newDistance }));
  
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {        },
      });
    }, [actions, setAnswer, trrack]);
  return (
    <div>
      <h1>Pause</h1>
      <p>Please pause here and inform the researcher you are ready for your next direction. Pleaes make sure you have:</p>
      <ul>
        <li>screen-shared your <strong>entire desktop</strong> in Zoom</li>
        <li>opened the document explorer tool in an <strong>incognito window</strong></li>
        <li>understood the <strong>interface tools</strong>. You may ask questions during your investigation too.</li>
      </ul>
      <p>To begin working with the interface, please <a href="https://indie.cise.ufl.edu/MaverickMystery/?=5" target="blank">click here to go to the document explorer tool.</a></p>
    </div>
  );
}

export default testTwo;
