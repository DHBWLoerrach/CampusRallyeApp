import VotingScreen from '@/screens/VotingScreen';

export default function RallyVotingScreen() {
  const onRefresh = async () => {
    // Refresh voting data
  };

  return <VotingScreen onRefresh={onRefresh} loading={false} />;
}