import { render, screen, fireEvent } from '@testing-library/react';
import { TopicMappingTable } from '../components/TopicMappingTable';
import { WeightageEditor } from '../components/WeightageEditor';
import { TopicMappingHealthWidget } from '../components/TopicMappingHealthWidget';
import { AvailableTopicsPanel } from '../components/AvailableTopicsPanel';
import { useRemoveTopic, useAdminTopics, useAssignTopic, useSectionTopics } from '../api/queries';
import {
  useWeightages,
  useUpdateWeightage,
  useCreateWeightage,
} from '@/services/topic-weightages/hooks';
import { useTopicMappingStore } from '../store/topic-mapping.store';

jest.mock('../api/queries', () => ({
  useRemoveTopic: jest.fn(),
  useAdminTopics: jest.fn(),
  useAssignTopic: jest.fn(),
  useSectionTopics: jest.fn(),
}));

jest.mock('@/services/topic-weightages/hooks', () => ({
  useWeightages: jest.fn(),
  useUpdateWeightage: jest.fn(),
  useCreateWeightage: jest.fn(),
}));

describe('Topic Mapping', () => {
  const mockRemoveTopic = jest.fn();
  const mockAssignTopic = jest.fn();
  const mockUpdateWeightage = jest.fn();
  const mockCreateWeightage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTopicMappingStore.setState({
      weightages: { '1': 100 },
      assignedTopics: [],
      selectedSectionId: 'sec1',
    });

    (useRemoveTopic as jest.Mock).mockReturnValue({ mutate: mockRemoveTopic, isPending: false });
    (useAssignTopic as jest.Mock).mockReturnValue({ mutate: mockAssignTopic, isPending: false });
    (useUpdateWeightage as jest.Mock).mockReturnValue({
      mutate: mockUpdateWeightage,
      isPending: false,
    });
    (useCreateWeightage as jest.Mock).mockReturnValue({
      mutate: mockCreateWeightage,
      isPending: false,
    });

    (useAdminTopics as jest.Mock).mockReturnValue({
      data: [
        { id: '1', topic: 'React', topicCode: 'R1' },
        { id: '2', topic: 'Angular', topicCode: 'A1' },
      ],
      isLoading: false,
    });

    (useSectionTopics as jest.Mock).mockReturnValue({
      data: [{ topicId: '1', topicName: 'React', topicCode: 'R1' }],
      isLoading: false,
    });

    (useWeightages as jest.Mock).mockReturnValue({
      data: [{ id: 'w1', topicId: '1', weightagePercentage: 100 }],
      isLoading: false,
    });
  });

  describe('Topic List Rendering', () => {
    it('renders the list of mapped topics with weightages', () => {
      const topics = [
        { topicId: '1', topicName: 'React', topicCode: 'R1', createdAt: '2023-01-01' },
      ];
      render(<TopicMappingTable sectionId='sec1' topics={topics} />);
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Weightage Editor', () => {
    it('renders inline weightage inputs and handles updates', () => {
      const topics = [{ topicId: '1', topicName: 'React', topicCode: 'R1' }];
      render(<WeightageEditor sectionId='sec1' topics={topics} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue(100);

      fireEvent.change(input, { target: { value: '80' } });
      fireEvent.blur(input);

      expect(mockUpdateWeightage).toHaveBeenCalledWith({ id: 'w1', weightagePercentage: 80 });
    });
  });

  describe('Topic Mapping Health Widget', () => {
    it('shows ready for blueprint when topics exist and weightage is 100', () => {
      const topics = [{ topicId: '1', topicName: 'React', topicCode: 'R1' }];
      render(<TopicMappingHealthWidget topics={topics} />);
      expect(screen.getByText('Ready For Blueprint')).toBeInTheDocument();
    });

    it('shows invalid configuration when weightage is not 100', () => {
      useTopicMappingStore.setState({ weightages: { '1': 80 } });
      const topics = [{ topicId: '1', topicName: 'React', topicCode: 'R1' }];
      render(<TopicMappingHealthWidget topics={topics} />);
      expect(screen.getByText('Invalid Configuration')).toBeInTheDocument();
    });
  });

  describe('Available Topics Panel', () => {
    it('renders available topics and allows assignment', () => {
      render(<AvailableTopicsPanel sectionId='sec1' existingTopicIds={[]} />);
      expect(screen.getByText('React')).toBeInTheDocument();

      const assignBtns = screen.getAllByText('Assign Topic');
      fireEvent.click(assignBtns[0]);

      expect(mockAssignTopic).toHaveBeenCalledWith('1');
    });
  });
});
