import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { sampleStudents } from '../utils/sampleData';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    color: '#1a365d'
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    width: '40%',
    fontSize: 12,
    color: '#4a5568'
  },
  value: {
    width: '60%',
    fontSize: 12,
    color: '#2d3748'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#718096'
  }
});

interface ResultReportProps {
  result: {
    studentId: string;
    subject: string;
    examId: string;
    marks: number;
    timestamp: string;
  };
}

const ResultReport = ({ result }: ResultReportProps) => {
  const getStudentName = (studentId: string) => {
    const student = sampleStudents.find(s => s.studentId === studentId);
    return student ? student.name : 'Unknown Student';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Examination Result</Text>
          <Text style={styles.subtitle}>Official Result Document</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Student Name:</Text>
            <Text style={styles.value}>{getStudentName(result.studentId)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student ID:</Text>
            <Text style={styles.value}>{result.studentId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Subject:</Text>
            <Text style={styles.value}>{result.subject}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Exam ID:</Text>
            <Text style={styles.value}>{result.examId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marks Obtained:</Text>
            <Text style={styles.value}>{result.marks}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Result:</Text>
            <Text style={styles.value}>{new Date(result.timestamp).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This is an official document. Any unauthorized modification is prohibited.</Text>
          <Text>© {new Date().getFullYear()} Examination Board</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ResultReport; 