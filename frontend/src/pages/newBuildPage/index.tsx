import PageLayout from '@/widgets/PageLayout';
import { Outlet } from 'react-router-dom';

const NewBuildPage = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default NewBuildPage;
