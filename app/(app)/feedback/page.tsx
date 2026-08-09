import { PageHeader } from "@/components/page-header"
import { getMyFeedback } from "@/app/actions/feedback"
import { FeedbackClient } from "./feedback-client"

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; message?: string }>
}) {
  const [myFeedback, params] = await Promise.all([getMyFeedback(), searchParams])
  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Share your thoughts, report bugs, or suggest features. Your feedback helps improve GramFolio."
      />
      <FeedbackClient
        myFeedback={myFeedback}
        prefillCategory={params.category}
        prefillMessage={params.message}
      />
    </div>
  )
}
