import { useCallback } from "react";
import { useStoreSelector } from "../../store/store";
import { StimulusParams } from "../../store/types";
import { markdownToHtml } from "./utils/markdownUtils";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function test({ parameters, setAnswer }: StimulusParams<any>) {
  const answers = parameters.testingStimulusValue
  // const answers = useStoreSelector((state) => state.answers["AdminStart_0"].answer.mainSummary);
  console.log("🚀 ~ test ~ answers:", answers)

  const markdwonTestText = markdownToHtml(String(answers))

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
  return (
    <div>
      <div 
        // ref={contentRef}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: markdwonTestText }}
      />
            <button onClick={clickCallback}>
        <p style={{ height: 400 }}>
      Hello 
    </p>
    </button></div>
  );
}

export default test;
