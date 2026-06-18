import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopicMappingTable } from '../components/TopicMappingTable';
import { AddTopicModal } from '../components/AddTopicModal';
import { useRemoveTopic, useAdminTopics, useAssignTopic } from '../api/queries';

jest.mock('../api/queries', () => ({
  useRemoveTopic: jest.fn(),
  useAdminTopics: jest.fn(),
  useAssignTopic: jest.fn(),
}));

describe('Topic Mapping', () => {
  const mockRemoveTopic = jest.fn();
  const mockAssignTopic = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRemoveTopic as jest.Mock).mockReturnValue({
      mutate: mockRemoveTopic,
      isPending: false,
    });

    (useAssignTopic as jest.Mock).mockReturnValue({
      mutate: mockAssignTopic,
      isPending: false,
    });

    (useAdminTopics as jest.Mock).mockReturnValue({
      data: [
        { id: '1', topic: 'React', topicCode: 'R1' },
        { id: '2', topic: 'Angular', topicCode: 'A1' },
      ],
      isLoading: false,
    });
  });

  describe('Topic List Rendering', () => {
    it('renders the list of mapped topics', () => {
      const topics = [
        { topicId: '1', topicName: 'React', topicCode: 'R1', createdAt: '2023-01-01' },
      ];
      render(<TopicMappingTable sectionId='sec1' topics={topics} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('R1')).toBeInTheDocument();
    });
  });

  describe('Remove Topic', () => {
    it('opens confirmation modal and removes topic', async () => {
      const topics = [
        { topicId: '1', topicName: 'React', topicCode: 'R1', createdAt: '2023-01-01' },
      ];
      render(<TopicMappingTable sectionId='sec1' topics={topics} />);

      const removeBtn = screen.getByText('Remove');
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(screen.getByText('Remove Topic Mapping?')).toBeInTheDocument();
      });

      const confirmBtn = screen.getAllByText('Remove')[1]; // second one is inside modal
      fireEvent.click(confirmBtn);

      expect(mockRemoveTopic).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  describe('Add Topic', () => {
    it('selects and assigns a topic', async () => {
      const onClose = jest.fn();
      render(
        <AddTopicModal sectionId='sec1' isOpen={true} onClose={onClose} existingTopicIds={[]} />,
      );

      expect(screen.getByText('Add Topic')).toBeInTheDocument();

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1' } });

      const assignBtn = screen.getByText('Assign');
      fireEvent.click(assignBtn);

      expect(mockAssignTopic).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });
});
