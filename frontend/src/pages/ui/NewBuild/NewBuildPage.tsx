import PageLayout from '@/shared/ui/PageLayout';
import { Outlet } from 'react-router-dom';

const NewBuildPage = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default NewBuildPage;
