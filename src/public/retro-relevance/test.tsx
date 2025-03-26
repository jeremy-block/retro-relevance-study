import { useCallback } from "react";
import { useStoreSelector } from "../../store/store";
import { StimulusParams } from "../../store/types";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function test({ parameters, setAnswer }: StimulusParams<any>) {
  const answers = useStoreSelector((state) => state.answers["AdminStart_0"].answer.mainSummary);

    const { taskid } = parameters;


    const clickCallback = useCallback((e: React.MouseEvent) => {
        const num = Math.random() * 100;

        setAnswer({
          status: true,
        //   provenanceGraph: trrack.graph.backend,
          answers: {
            [taskid]: num,
          },
        });
      }, [setAnswer]);
  console.log("🚀 ~ test ~ answers:", answers)
  return (
    <div>
      <p>
        {answers}
      </p>
      <button onClick={clickCallback}>
        <p style={{ height: 400 }}>
      Hello 
    </p>
    </button></div>
  );
}

export default test;
