import ImageQuestions from "../screens/questions/ImageQuestions";
import MultipleChoiceQuestions from "../screens/questions/MultipleChoiceQuestions";
import QRCodeQuestions from "../screens/questions/QRCodeQuestions";
import SkillQuestions from "../screens/questions/SkillQuestions";
import UploadQuestions from "../screens/questions/UploadQuestions";

const questionTypeComponents = {
  // Anpassung der Keys an die tatsächlichen Typen aus der Datenbank
  picture: ImageQuestions,
  knowledge: SkillQuestions,
  upload: UploadQuestions,
  qr_code: QRCodeQuestions,
  multiple_choice: MultipleChoiceQuestions,
};

export default questionTypeComponents;
