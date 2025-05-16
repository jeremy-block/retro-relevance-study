import {
  Center, Flex, Loader, Space, Text,
} from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import { useStudyConfig } from '../store/hooks/useStudyConfig';
import { ReactMarkdownWrapper } from './ReactMarkdownWrapper';
import { useDisableBrowserBack } from '../utils/useDisableBrowserBack';
import { useStorageEngine } from '../storage/storageEngineHooks';
import { useStoreSelector } from '../store/store';
import { ParticipantData } from '../storage/types';
import { download } from './downloader/DownloadTidy';
import { useStudyId } from '../routes/utils';
import { useIsAnalysis } from '../store/hooks/useIsAnalysis';

export function StudyEnd() {
  const studyConfig = useStudyConfig();
  const { storageEngine } = useStorageEngine();
  const answers = useStoreSelector((state) => state.answers);

  const isAnalysis = useIsAnalysis();

  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    // Don't save to the storage engine in analysis
    if (isAnalysis) {
      setCompleted(true);
      return;
    }

    // verify that storageEngine.verifyCompletion() returns true, loop until it does
    const interval = setInterval(async () => {
      const isComplete = await storageEngine!.verifyCompletion(answers);
      if (isComplete) {
        setCompleted(true);
        clearInterval(interval);
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable browser back button on study end
  useDisableBrowserBack();

  const [participantData, setParticipantData] = useState<ParticipantData | null>();
  const [participantId, setParticipantId] = useState('');
  const baseFilename = studyConfig.studyMetadata.title.replace(' ', '_');
  useEffect(() => {
    async function fetchParticipantId() {
      if (storageEngine) {
        const _participantId = await storageEngine.getCurrentParticipantId();
        const _participantData = await storageEngine.getParticipantData();

        setParticipantId(_participantId);
        setParticipantData(_participantData);
      }
    }
    fetchParticipantId();
  }, [storageEngine]);
  const downloadParticipant = useCallback(async () => {
    download(JSON.stringify(participantData, null, 2), `${baseFilename}_${participantId}.json`);
  }, [baseFilename, participantData, participantId]);

  const autoDownload = studyConfig.uiConfig.autoDownloadStudy || false;
  const autoDownloadDelay = autoDownload
    ? studyConfig.uiConfig.autoDownloadTime || -1
    : -1;

  const [delayCounter, setDelayCounter] = useState(
    Math.floor(autoDownloadDelay / 1000),
  );

  useEffect(() => {
    if (completed) {
      const interval = setInterval(() => {
        setDelayCounter((c) => c - 1);
      }, 1000);

      if (delayCounter <= 0) {
        if (autoDownload) {
          downloadParticipant();
        }
        clearInterval(interval);
        return () => clearInterval(interval);
      }

      return () => clearInterval(interval);
    }
    return () => {};
  }, [autoDownload, completed, delayCounter, downloadParticipant]);
  
  const studyId = useStudyId();
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);
  useEffect(() => {
    const checkDataCollectionEnabled = async () => {
      if (storageEngine) {
        const modes = await storageEngine.getModes(studyId);
        setDataCollectionEnabled(modes.dataCollectionEnabled);
      }
    };
    checkDataCollectionEnabled();
  }, [storageEngine, studyId]);
  
  
  //Establish keys from answers that will have the SONA ID code to add to a return link
  // This is a temporary solution until we can get a custom URL parameter to include in response to a participant collection service.
  // This basically will check to see if the service name is set in the user's answers and if so, it will add the SONA ID code to the return link.
  // If they do not have a SONA ID code set by the url, then they will see the studyEndMsg that is established in the studyConfig.
  const externalServiceName = studyConfig.uiConfig.urlParticipantIdParam || "SONA";
  const collectionComponent: string = Object.keys(answers).find((key) => key.toLowerCase().startsWith('screener_')) || 'Screener_1';
  const localParamKeyforExternalURL: string = Object.keys(answers[collectionComponent]?.answer || {}).find((answer: string) => answer.toLowerCase().startsWith(externalServiceName)) || 'sona_id';

  //for testing
  // console.log("🚀 ~ StudyEnd ~ answers:", answers)
  // console.log("🚀 ~ StudyEnd ~ collectionComponent Key:", collectionComponent)
  // console.log("🚀 ~ StudyEnd ~ localParamKeyforExternalURL in that component that collects urlParticipantIdParam:", localParamKeyforExternalURL)
  // console.log(studyConfig);
  
  const sonaMessage = `Thank you for participating in this study. Please click for credit: [Back to ${externalServiceName}](https://ufl-cise.sona-systems.com/webstudy_credit.aspx?experiment_id=163&credit_token=76f116f1f7814ef5a8d135b551c0cbb6&survey_code=${answers[collectionComponent].answer[localParamKeyforExternalURL]}).`;
  // Determine the final message to display to the participant.
  // If the study is using an external service like SONA and the participant's ID is available,
  // display a message with a link to return to the external service for credit.
  // Otherwise, display the configured study end message or a default message.
  const finishWords = (studyConfig.uiConfig.urlParticipantIdParam === externalServiceName && (answers[collectionComponent]?.answer?.[localParamKeyforExternalURL] !== null && answers[collectionComponent]?.answer?.[localParamKeyforExternalURL] !== undefined)) 
    ? sonaMessage 
    : studyConfig.uiConfig.studyEndMsg || "Default end message.";

  return (
    <Center style={{ height: '100%' }}>
      <Flex direction="column">
        {completed || !dataCollectionEnabled
          ? (studyConfig.uiConfig.studyEndMsg
            ? <ReactMarkdownWrapper text={finishWords} />
            : <Text size="xl" display="block">Thank you for completing the study. You may close this window now.</Text>)
          : (
            <>
              <Text size="xl" display="block">Please wait while your answers are uploaded.</Text>
              <Space h="lg" />
              <Center>
                <Loader color="blue" />
              </Center>
            </>
          )}
      </Flex>
    </Center>
  );
}
